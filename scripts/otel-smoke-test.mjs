#!/usr/bin/env node
// End-to-end smoke test of every admin + checkout endpoint, meant to generate real traffic
// (transactions, errors, DynamoDB calls, checkout -> admin distributed traces) for New Relic.
//
// It writes to the target environment, but cleans up after itself:
//   - category / product / orders created here are deleted at the end (product is created
//     `inactive`, so it never shows in the storefront).
//   - stores and internal users have no DELETE endpoint: a single inactive TEST-OTEL store and
//     user are created once and reused on later runs.
//
// Usage (PowerShell):
//   $env:SMOKE_ADMIN_USERNAME = "..."; $env:SMOKE_ADMIN_PASSWORD = "..."
//   $env:SMOKE_PUBLIC_TOKEN = "..."; $env:SMOKE_CHECKOUT_SERVICE_TOKEN = "..."   # optional
//   node scripts/otel-smoke-test.mjs
//
// Env vars: SMOKE_BASE_URL (default https://mayocollections.com), SMOKE_DELAY_MS (default 300),
//           SMOKE_ADMIN_URL / SMOKE_CHECKOUT_URL (override each API base, e.g. local backends).
// In New Relic, filter this traffic with: user_agent.original = 'trini-otel-smoke/1.0'

const BASE_URL = (process.env.SMOKE_BASE_URL ?? 'https://mayocollections.com').replace(/\/$/, '');
const DELAY_MS = Number(process.env.SMOKE_DELAY_MS ?? 300);
const USER_AGENT = 'trini-otel-smoke/1.0';
const TEST_PREFIX = 'TEST-OTEL';
const RUN_ID = Date.now().toString(36);

// Optional per-service overrides, e.g. to run against local backends without the gateway.
const ADMIN = process.env.SMOKE_ADMIN_URL ?? `${BASE_URL}/api/v1/admin`;
const CHECKOUT = process.env.SMOKE_CHECKOUT_URL ?? `${BASE_URL}/api/v1/checkout`;

const required = ['SMOKE_ADMIN_USERNAME', 'SMOKE_ADMIN_PASSWORD', 'SMOKE_PUBLIC_TOKEN'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const results = [];
const cleanup = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_RATE_LIMIT_RETRIES = 3;

const call = async (name, { method = 'GET', url, token, body, headers = {}, expect }, attempt = 0) => {
  await sleep(DELAY_MS);
  const startedAt = performance.now();
  let status = 0;
  let payload = null;
  let retryAfterSeconds = 0;
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'user-agent': USER_AGENT,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    status = response.status;
    retryAfterSeconds = Number(response.headers.get('ratelimit-reset') ?? 10);
    const text = await response.text();
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }
  } catch (err) {
    payload = { networkError: err.message };
  }
  const expected = [expect].flat();
  // express-rate-limit allows 120 req/min per Lambda instance: wait for the window and retry.
  if (status === 429 && !expected.includes(429) && attempt < MAX_RATE_LIMIT_RETRIES) {
    console.warn(`Rate limited on "${name}", retrying in ${retryAfterSeconds}s...`);
    await sleep((retryAfterSeconds + 1) * 1000);
    return call(name, { method, url, token, body, headers, expect }, attempt + 1);
  }
  const ok = expected.includes(status);
  results.push({
    ok,
    name,
    method,
    path: url.replace(BASE_URL, ''),
    status,
    expected: expected.join('|'),
    ms: Math.round(performance.now() - startedAt),
    error: ok ? '' : JSON.stringify(payload?.error ?? payload)?.slice(0, 160),
  });
  return { ok, status, data: payload?.data, payload };
};

const login = async () => {
  const { data } = await call('auth: login', {
    method: 'POST',
    url: `${ADMIN}/auth/login`,
    body: {
      username: process.env.SMOKE_ADMIN_USERNAME,
      password: process.env.SMOKE_ADMIN_PASSWORD,
    },
    expect: 200,
  });
  if (!data?.token) {
    throw new Error('Login failed: cannot continue with admin endpoints');
  }
  return data.token;
};

const runPublicReads = async (publicToken) => {
  const { data } = await call('public: list products', {
    url: `${ADMIN}/products`,
    token: publicToken,
    expect: 200,
  });
  await call('public: list products (filtered)', {
    url: `${ADMIN}/products?featured=true&status=active&maxPrice=500`,
    token: publicToken,
    expect: 200,
  });
  await call('public: product options', { url: `${ADMIN}/products/options`, token: publicToken, expect: 200 });
  const firstProductId = data?.products?.[0]?.id;
  if (firstProductId) {
    await call('public: product by id', {
      url: `${ADMIN}/products/${firstProductId}`,
      token: publicToken,
      expect: 200,
    });
  }
  await call('public: list categories', { url: `${ADMIN}/categories`, token: publicToken, expect: 200 });
  const stores = await call('public: pickup stores', {
    url: `${ADMIN}/stores/pickup`,
    token: publicToken,
    expect: 200,
  });
  const firstStoreId = stores.data?.stores?.[0]?.id;
  if (firstStoreId) {
    await call('public: pickup store by id', {
      url: `${ADMIN}/stores/pickup/${firstStoreId}`,
      token: publicToken,
      expect: 200,
    });
  }
  await call('public: storefront settings', {
    url: `${ADMIN}/storefront-settings`,
    token: publicToken,
    expect: 200,
  });
};

// Controlled failures: populate Errors inbox / error rate with known, expected cases.
const runErrorCases = async (publicToken) => {
  await call('error: admin without token', { url: `${ADMIN}/orders`, expect: 401 });
  await call('error: admin with public token', { url: `${ADMIN}/orders`, token: publicToken, expect: 401 });
  await call('error: invalid token', { url: `${ADMIN}/products`, token: 'invalid-token', expect: 401 });
  await call('error: bad login', {
    method: 'POST',
    url: `${ADMIN}/auth/login`,
    body: { username: 'nobody', password: 'wrong' },
    expect: 401,
  });
  await call('error: product not found', {
    url: `${ADMIN}/products/${TEST_PREFIX}-does-not-exist`,
    token: publicToken,
    expect: 404,
  });
  await call('error: invalid catalog query', {
    url: `${ADMIN}/products?maxPrice=-1`,
    token: publicToken,
    expect: 400,
  });
  await call('error: CORS origin rejected', {
    url: `${ADMIN}/products`,
    token: publicToken,
    headers: { origin: 'https://not-allowed.example' },
    expect: 403,
  });
  await call('error: checkout empty cart', { method: 'POST', url: `${CHECKOUT}/whatsapp`, body: {}, expect: 400 });
  await call('error: checkout unknown product', {
    method: 'POST',
    url: `${CHECKOUT}/whatsapp`,
    body: {
      items: [{ productId: `${TEST_PREFIX}-does-not-exist`, quantity: 1 }],
      customer: { phone: '999999999', firstName: 'Prueba', lastName: 'Otel' },
      delivery: { method: 'courier' },
    },
    expect: 404,
  });
  await call('error: shared checkout without token', { url: `${CHECKOUT}/shared`, expect: 400 });
  await call('error: shared checkout invalid token', { url: `${CHECKOUT}/shared?token=invalid`, expect: [400, 404] });
};

const runAdminReads = async (adminToken) => {
  await call('admin: list orders', { url: `${ADMIN}/orders`, token: adminToken, expect: 200 });
  await call('admin: list stores', { url: `${ADMIN}/stores`, token: adminToken, expect: 200 });
  await call('admin: list internal users', { url: `${ADMIN}/internal-users`, token: adminToken, expect: 200 });
};

const runCatalogLifecycle = async (adminToken) => {
  const category = await call('admin: create category', {
    method: 'POST',
    url: `${ADMIN}/categories`,
    token: adminToken,
    body: { name: `${TEST_PREFIX} ${RUN_ID}`, slug: `test-otel-${RUN_ID}`, active: false },
    expect: 201,
  });
  const categoryId = category.data?.category?.id;
  if (categoryId) {
    cleanup.push(['admin: delete category', `${ADMIN}/categories/${categoryId}`]);
    await call('admin: update category', {
      method: 'PUT',
      url: `${ADMIN}/categories/${categoryId}`,
      token: adminToken,
      body: { name: `${TEST_PREFIX} ${RUN_ID} updated`, active: false },
      expect: 200,
    });
  }

  // PUT validates the full create schema, so the update re-sends the whole body.
  const productBody = {
    name: `${TEST_PREFIX} producto ${RUN_ID}`,
    sku: `${TEST_PREFIX}-${RUN_ID}`,
    description: 'Producto de prueba de observabilidad. Se elimina automaticamente.',
    category: category.data?.category?.slug ?? `test-otel-${RUN_ID}`,
    price: 1,
    currency: 'PEN',
    stock: 10,
    status: 'inactive',
  };
  const product = await call('admin: create product', {
    method: 'POST',
    url: `${ADMIN}/products`,
    token: adminToken,
    body: productBody,
    expect: 201,
  });
  const productId = product.data?.product?.id;
  if (productId) {
    // Cleanup runs in reverse order: product goes before its category.
    cleanup.push(['admin: delete product', `${ADMIN}/products/${productId}`]);
    await call('admin: update product', {
      method: 'PUT',
      url: `${ADMIN}/products/${productId}`,
      token: adminToken,
      body: { ...productBody, stock: 9 },
      expect: 200,
    });
  }
  return productId;
};

// Full distributed trace: checkout -> admin (product lookup, order creation, checkout ranking).
const runCheckoutFlow = async (adminToken, productId) => {
  if (!productId) {
    return;
  }
  const checkout = await call('checkout: whatsapp (creates order)', {
    method: 'POST',
    url: `${CHECKOUT}/whatsapp`,
    body: {
      items: [{ productId, quantity: 1 }],
      customer: { phone: '999999999', firstName: 'Prueba', lastName: 'Observabilidad' },
      delivery: { method: 'courier' },
    },
    expect: 201,
  });
  if (checkout.data?.orderId) {
    cleanup.push(['checkout order', `${ADMIN}/orders/${checkout.data.orderId}`, { isOrder: true }]);
    await call('admin: update order', {
      method: 'PUT',
      url: `${ADMIN}/orders/${checkout.data.orderId}`,
      token: adminToken,
      body: { paymentStatus: 'paid' },
      expect: 200,
    });
  }

  const shareToken = checkout.data?.sharedCartUrl
    ? new URL(checkout.data.sharedCartUrl).searchParams.get('token')
    : null;
  if (shareToken) {
    await call('checkout: share preview', {
      url: `${CHECKOUT}/share?token=${encodeURIComponent(shareToken)}`,
      expect: 200,
    });
    await call('checkout: resolve shared cart', {
      url: `${CHECKOUT}/shared?token=${encodeURIComponent(shareToken)}`,
      expect: 200,
    });
  }

  await call('public: register checkout items', {
    method: 'POST',
    url: `${ADMIN}/products/register-checkout`,
    token: process.env.SMOKE_PUBLIC_TOKEN,
    body: { items: [{ productId, quantity: 1 }] },
    expect: [200, 204],
  });
};

const runDirectCheckoutOrder = async (productId) => {
  const serviceToken = process.env.SMOKE_CHECKOUT_SERVICE_TOKEN;
  if (!serviceToken || !productId) {
    return;
  }
  const order = await call('service: create order (checkout token)', {
    method: 'POST',
    url: `${ADMIN}/orders`,
    token: serviceToken,
    body: {
      checkoutUrl: `${BASE_URL}/?smoke=${RUN_ID}`,
      customerPhone: '999999999',
      referenceFirstName: 'Prueba',
      referenceLastName: 'Observabilidad',
      itemCount: 1,
      subtotal: 1,
      delivery: { method: 'courier' },
      items: [{ productId, productName: `${TEST_PREFIX} producto`, quantity: 1, unitPrice: 1 }],
    },
    expect: 201,
  });
  if (order.data?.order?.id) {
    cleanup.push(['service order', `${ADMIN}/orders/${order.data.order.id}`, { isOrder: true }]);
  }
};

const runReusableFixtures = async (adminToken) => {
  const stores = await call('admin: find test store', { url: `${ADMIN}/stores`, token: adminToken, expect: 200 });
  const testStore = stores.data?.stores?.find((store) => store.slug === 'test-otel');
  const storeBody = {
    name: `${TEST_PREFIX} tienda`,
    slug: 'test-otel',
    address: 'Direccion de prueba 123',
    district: 'Prueba',
    reference: `Tienda de prueba de observabilidad (run ${RUN_ID})`,
    pickupEnabled: false,
    // A store must support pickup or courier; `active: false` keeps it hidden anyway.
    courierEnabled: true,
    active: false,
  };
  if (testStore) {
    await call('admin: update test store', {
      method: 'PUT',
      url: `${ADMIN}/stores/${testStore.id}`,
      token: adminToken,
      body: storeBody,
      expect: 200,
    });
  } else {
    await call('admin: create test store', {
      method: 'POST',
      url: `${ADMIN}/stores`,
      token: adminToken,
      body: storeBody,
      expect: 201,
    });
  }

  const users = await call('admin: find test user', { url: `${ADMIN}/internal-users`, token: adminToken, expect: 200 });
  const email = 'test-otel@example.com';
  if (!users.data?.users?.some((user) => user.email === email)) {
    await call('admin: create test internal user', {
      method: 'POST',
      url: `${ADMIN}/internal-users`,
      token: adminToken,
      body: { name: `${TEST_PREFIX} usuario`, email, role: 'support', active: false },
      expect: 201,
    });
  }

  // Round-trip: write back exactly what is there, so the live storefront doesn't change.
  const settings = await call('admin: get storefront settings', {
    url: `${ADMIN}/storefront-settings`,
    token: adminToken,
    expect: 200,
  });
  const current = settings.data?.settings;
  if (current?.catalogOptions && current?.promoBanner) {
    await call('admin: update storefront settings (no-op)', {
      method: 'PUT',
      url: `${ADMIN}/storefront-settings`,
      token: adminToken,
      body: { catalogOptions: current.catalogOptions, promoBanner: current.promoBanner },
      expect: 200,
    });
  }
};

const runCleanup = async (adminToken) => {
  for (const [name, url, { isOrder = false } = {}] of cleanup.reverse()) {
    if (isOrder) {
      // Business rule: an order must be inactive before it can be deleted.
      await call(`admin: deactivate ${name}`, {
        method: 'PUT',
        url,
        token: adminToken,
        body: { status: 'inactive' },
        expect: 200,
      });
    }
    await call(isOrder ? `admin: delete ${name}` : name, {
      method: 'DELETE',
      url,
      token: adminToken,
      expect: [200, 204],
    });
  }
};

const printSummary = () => {
  console.table(
    results.map(({ ok, name, method, path, status, expected, ms, error }) => ({
      result: ok ? 'OK' : 'FAIL',
      name,
      request: `${method} ${path.length > 60 ? `${path.slice(0, 57)}...` : path}`,
      status: `${status} (exp ${expected})`,
      ms,
      ...(error ? { error } : {}),
    })),
  );
  const failed = results.filter((result) => !result.ok);
  console.log(`\nRun ${RUN_ID}: ${results.length - failed.length}/${results.length} OK against ${BASE_URL}`);
  console.log(`New Relic NRQL: FROM Span SELECT count(*) WHERE user_agent.original = '${USER_AGENT}' FACET service.name, name SINCE 30 minutes ago`);
  return failed.length;
};

let adminToken;
try {
  await runPublicReads(process.env.SMOKE_PUBLIC_TOKEN);
  await runErrorCases(process.env.SMOKE_PUBLIC_TOKEN);
  adminToken = await login();
  await runAdminReads(adminToken);
  const productId = await runCatalogLifecycle(adminToken);
  await runCheckoutFlow(adminToken, productId);
  await runDirectCheckoutOrder(productId);
  await runReusableFixtures(adminToken);
} catch (err) {
  console.error(`Aborted: ${err.message}`);
} finally {
  if (adminToken) {
    await runCleanup(adminToken);
  } else if (cleanup.length > 0) {
    console.error('Could not clean up (no admin token):', cleanup.map(([, url]) => url));
  }
}

process.exit(printSummary() > 0 ? 1 : 0);
