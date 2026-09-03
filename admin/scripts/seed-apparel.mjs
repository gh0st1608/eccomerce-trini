const ADMIN_BASE_URL = process.env.ADMIN_BASE_URL ?? 'http://localhost:3001/api/v1/admin';
const ADMIN_USERNAME = process.env.ADMIN_AUTH_USERNAME ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_AUTH_PASSWORD ?? 'admin123';

const apparelProducts = [
  {
    name: 'Camisa Oxford Slim Fit',
    sku: 'CAM-OXF-001',
    variantGroup: 'CAMISA-OXFORD-SLIM',
    category: 'camisas',
    categories: ['ropa', 'camisas'],
    description: 'Camisa Oxford de algodon para oficina y uso diario.',
    imageUrl: 'https://picsum.photos/seed/camisa-oxford-main/900/1200',
    images: [
      'https://picsum.photos/seed/camisa-oxford-main/900/1200',
      'https://picsum.photos/seed/camisa-oxford-alt1/900/1200',
    ],
    colors: ['Blanco', 'Celeste'],
    sizes: ['S', 'M', 'L'],
    currency: 'PEN',
    price: 109.9,
    originalPrice: 139.9,
    discountPercent: 21,
    stock: 18,
    featured: true,
    status: 'active',
    productType: 'variable',
    attributes: [
      { name: 'Color', values: ['Blanco', 'Celeste'] },
      { name: 'Talla', values: ['S', 'M', 'L'] },
      { name: 'Material', values: ['Algodon Oxford'] },
    ],
    inventory: { quantity: 18, inStock: true },
    prices: [
      { currency: 'PEN', amount: 109.9, originalAmount: 139.9, discountPercent: 21 },
    ],
    storeAvailability: [
      { storeId: 'store-001', available: true, quantity: 8 },
      { storeId: 'store-002', available: true, quantity: 10 },
    ],
    variants: [
      {
        sku: 'CAM-OXF-001-BLA-S',
        name: 'Camisa Oxford Blanca S',
        imageUrl: 'https://picsum.photos/seed/camisa-oxford-bla-s/900/1200',
        attributes: [
          { name: 'Color', value: 'Blanco' },
          { name: 'Talla', value: 'S' },
        ],
        inventory: { quantity: 3, inStock: true },
        prices: [{ currency: 'PEN', amount: 109.9, originalAmount: 139.9, discountPercent: 21 }],
      },
      {
        sku: 'CAM-OXF-001-BLA-M',
        name: 'Camisa Oxford Blanca M',
        imageUrl: 'https://picsum.photos/seed/camisa-oxford-bla-m/900/1200',
        attributes: [
          { name: 'Color', value: 'Blanco' },
          { name: 'Talla', value: 'M' },
        ],
        inventory: { quantity: 4, inStock: true },
        prices: [{ currency: 'PEN', amount: 109.9, originalAmount: 139.9, discountPercent: 21 }],
      },
      {
        sku: 'CAM-OXF-001-CEL-L',
        name: 'Camisa Oxford Celeste L',
        imageUrl: 'https://picsum.photos/seed/camisa-oxford-cel-l/900/1200',
        attributes: [
          { name: 'Color', value: 'Celeste' },
          { name: 'Talla', value: 'L' },
        ],
        inventory: { quantity: 2, inStock: true },
        prices: [{ currency: 'PEN', amount: 114.9, originalAmount: 149.9, discountPercent: 23 }],
      },
    ],
  },
  {
    name: 'Camisa Lino Relaxed',
    sku: 'CAM-LIN-002',
    variantGroup: 'CAMISA-LINO-RELAX',
    category: 'camisas',
    categories: ['ropa', 'camisas'],
    description: 'Camisa de lino ligera, ideal para clima calido.',
    imageUrl: 'https://picsum.photos/seed/camisa-lino-main/900/1200',
    images: [
      'https://picsum.photos/seed/camisa-lino-main/900/1200',
      'https://picsum.photos/seed/camisa-lino-alt1/900/1200',
    ],
    colors: ['Arena', 'Verde Olivo'],
    sizes: ['M', 'L', 'XL'],
    currency: 'PEN',
    price: 129.9,
    originalPrice: 159.9,
    discountPercent: 19,
    stock: 15,
    featured: false,
    status: 'active',
    productType: 'variable',
    attributes: [
      { name: 'Color', values: ['Arena', 'Verde Olivo'] },
      { name: 'Talla', values: ['M', 'L', 'XL'] },
      { name: 'Material', values: ['Lino'] },
    ],
    inventory: { quantity: 15, inStock: true },
    prices: [
      { currency: 'PEN', amount: 129.9, originalAmount: 159.9, discountPercent: 19 },
    ],
    storeAvailability: [
      { storeId: 'store-001', available: true, quantity: 6 },
      { storeId: 'store-002', available: true, quantity: 9 },
    ],
    variants: [
      {
        sku: 'CAM-LIN-002-ARE-M',
        name: 'Camisa Lino Arena M',
        imageUrl: 'https://picsum.photos/seed/camisa-lino-are-m/900/1200',
        attributes: [
          { name: 'Color', value: 'Arena' },
          { name: 'Talla', value: 'M' },
        ],
        inventory: { quantity: 3, inStock: true },
        prices: [{ currency: 'PEN', amount: 129.9, originalAmount: 159.9, discountPercent: 19 }],
      },
      {
        sku: 'CAM-LIN-002-ARE-L',
        name: 'Camisa Lino Arena L',
        imageUrl: 'https://picsum.photos/seed/camisa-lino-are-l/900/1200',
        attributes: [
          { name: 'Color', value: 'Arena' },
          { name: 'Talla', value: 'L' },
        ],
        inventory: { quantity: 4, inStock: true },
        prices: [{ currency: 'PEN', amount: 129.9, originalAmount: 159.9, discountPercent: 19 }],
      },
      {
        sku: 'CAM-LIN-002-OLI-XL',
        name: 'Camisa Lino Verde Olivo XL',
        imageUrl: 'https://picsum.photos/seed/camisa-lino-oli-xl/900/1200',
        attributes: [
          { name: 'Color', value: 'Verde Olivo' },
          { name: 'Talla', value: 'XL' },
        ],
        inventory: { quantity: 2, inStock: true },
        prices: [{ currency: 'PEN', amount: 134.9, originalAmount: 169.9, discountPercent: 21 }],
      },
    ],
  },
  {
    name: 'Pantalon Chino Regular',
    sku: 'PAN-CHI-001',
    variantGroup: 'PANTALON-CHINO-REG',
    category: 'pantalones',
    categories: ['ropa', 'pantalones'],
    description: 'Pantalon chino de corte regular para uso casual.',
    imageUrl: 'https://picsum.photos/seed/pantalon-chino-main/900/1200',
    images: [
      'https://picsum.photos/seed/pantalon-chino-main/900/1200',
      'https://picsum.photos/seed/pantalon-chino-alt1/900/1200',
    ],
    colors: ['Khaki', 'Azul Marino'],
    sizes: ['30', '32', '34'],
    currency: 'PEN',
    price: 119.9,
    originalPrice: 149.9,
    discountPercent: 20,
    stock: 20,
    featured: true,
    status: 'active',
    productType: 'variable',
    attributes: [
      { name: 'Color', values: ['Khaki', 'Azul Marino'] },
      { name: 'Talla', values: ['30', '32', '34'] },
      { name: 'Material', values: ['Gabardina'] },
    ],
    inventory: { quantity: 20, inStock: true },
    prices: [
      { currency: 'PEN', amount: 119.9, originalAmount: 149.9, discountPercent: 20 },
    ],
    storeAvailability: [
      { storeId: 'store-001', available: true, quantity: 9 },
      { storeId: 'store-002', available: true, quantity: 11 },
    ],
    variants: [
      {
        sku: 'PAN-CHI-001-KHA-30',
        name: 'Pantalon Chino Khaki 30',
        imageUrl: 'https://picsum.photos/seed/pantalon-chino-kha-30/900/1200',
        attributes: [
          { name: 'Color', value: 'Khaki' },
          { name: 'Talla', value: '30' },
        ],
        inventory: { quantity: 3, inStock: true },
        prices: [{ currency: 'PEN', amount: 119.9, originalAmount: 149.9, discountPercent: 20 }],
      },
      {
        sku: 'PAN-CHI-001-KHA-32',
        name: 'Pantalon Chino Khaki 32',
        imageUrl: 'https://picsum.photos/seed/pantalon-chino-kha-32/900/1200',
        attributes: [
          { name: 'Color', value: 'Khaki' },
          { name: 'Talla', value: '32' },
        ],
        inventory: { quantity: 4, inStock: true },
        prices: [{ currency: 'PEN', amount: 119.9, originalAmount: 149.9, discountPercent: 20 }],
      },
      {
        sku: 'PAN-CHI-001-MAR-34',
        name: 'Pantalon Chino Azul Marino 34',
        imageUrl: 'https://picsum.photos/seed/pantalon-chino-mar-34/900/1200',
        attributes: [
          { name: 'Color', value: 'Azul Marino' },
          { name: 'Talla', value: '34' },
        ],
        inventory: { quantity: 2, inStock: true },
        prices: [{ currency: 'PEN', amount: 124.9, originalAmount: 154.9, discountPercent: 19 }],
      },
    ],
  },
  {
    name: 'Pantalon Jean Slim',
    sku: 'PAN-JEA-002',
    variantGroup: 'PANTALON-JEAN-SLIM',
    category: 'pantalones',
    categories: ['ropa', 'pantalones'],
    description: 'Jean slim stretch con lavado clasico.',
    imageUrl: 'https://picsum.photos/seed/pantalon-jean-main/900/1200',
    images: [
      'https://picsum.photos/seed/pantalon-jean-main/900/1200',
      'https://picsum.photos/seed/pantalon-jean-alt1/900/1200',
    ],
    colors: ['Azul Oscuro', 'Negro'],
    sizes: ['30', '32', '34'],
    currency: 'PEN',
    price: 139.9,
    originalPrice: 169.9,
    discountPercent: 18,
    stock: 16,
    featured: false,
    status: 'active',
    productType: 'variable',
    attributes: [
      { name: 'Color', values: ['Azul Oscuro', 'Negro'] },
      { name: 'Talla', values: ['30', '32', '34'] },
      { name: 'Material', values: ['Denim Stretch'] },
    ],
    inventory: { quantity: 16, inStock: true },
    prices: [
      { currency: 'PEN', amount: 139.9, originalAmount: 169.9, discountPercent: 18 },
    ],
    storeAvailability: [
      { storeId: 'store-001', available: true, quantity: 7 },
      { storeId: 'store-002', available: true, quantity: 9 },
    ],
    variants: [
      {
        sku: 'PAN-JEA-002-AZO-30',
        name: 'Jean Slim Azul Oscuro 30',
        imageUrl: 'https://picsum.photos/seed/pantalon-jean-azo-30/900/1200',
        attributes: [
          { name: 'Color', value: 'Azul Oscuro' },
          { name: 'Talla', value: '30' },
        ],
        inventory: { quantity: 3, inStock: true },
        prices: [{ currency: 'PEN', amount: 139.9, originalAmount: 169.9, discountPercent: 18 }],
      },
      {
        sku: 'PAN-JEA-002-AZO-32',
        name: 'Jean Slim Azul Oscuro 32',
        imageUrl: 'https://picsum.photos/seed/pantalon-jean-azo-32/900/1200',
        attributes: [
          { name: 'Color', value: 'Azul Oscuro' },
          { name: 'Talla', value: '32' },
        ],
        inventory: { quantity: 3, inStock: true },
        prices: [{ currency: 'PEN', amount: 139.9, originalAmount: 169.9, discountPercent: 18 }],
      },
      {
        sku: 'PAN-JEA-002-NEG-34',
        name: 'Jean Slim Negro 34',
        imageUrl: 'https://picsum.photos/seed/pantalon-jean-neg-34/900/1200',
        attributes: [
          { name: 'Color', value: 'Negro' },
          { name: 'Talla', value: '34' },
        ],
        inventory: { quantity: 2, inStock: true },
        prices: [{ currency: 'PEN', amount: 144.9, originalAmount: 174.9, discountPercent: 17 }],
      },
    ],
  },
];

const requestJson = async ({ path, method = 'GET', token, body }) => {
  const response = await fetch(`${ADMIN_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = payload?.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`${method} ${path} failed: ${errorMessage}`);
  }

  return payload;
};

const login = async () => {
  const payload = await requestJson({
    path: '/auth/login',
    method: 'POST',
    body: {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    },
  });

  const token = payload?.data?.token;
  if (!token) {
    throw new Error('Login succeeded but token was missing');
  }

  return token;
};

const upsertProducts = async (token) => {
  const existingPayload = await requestJson({ path: '/products', method: 'GET', token });
  const existingProducts = existingPayload?.data?.products ?? [];
  const existingBySku = new Map(existingProducts.map((item) => [item.sku, item]));

  const results = [];

  for (const product of apparelProducts) {
    const existing = existingBySku.get(product.sku);

    if (existing?.id) {
      const updatePayload = await requestJson({
        path: `/products/${existing.id}`,
        method: 'PUT',
        token,
        body: product,
      });

      results.push({ action: 'updated', sku: product.sku, id: updatePayload?.data?.product?.id ?? existing.id });
      continue;
    }

    const createPayload = await requestJson({
      path: '/products',
      method: 'POST',
      token,
      body: product,
    });

    results.push({ action: 'created', sku: product.sku, id: createPayload?.data?.product?.id ?? 'unknown' });
  }

  return results;
};

const main = async () => {
  console.log(`Seeding de ropa en ${ADMIN_BASE_URL}`);
  const token = await login();
  const results = await upsertProducts(token);

  console.log('Resultado de seed:');
  results.forEach((row) => {
    console.log(`- ${row.action.toUpperCase()} | ${row.sku} | ${row.id}`);
  });
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
