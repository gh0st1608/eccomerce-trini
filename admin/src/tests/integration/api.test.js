import request from 'supertest';
import { createContainer } from '../../container.js';
import { createApp } from '../../app.js';

describe('Admin API', () => {
  const { logger, controllers } = createContainer();
  const app = createApp({ logger, controllers });

  const loginPayload = {
    username: process.env.ADMIN_AUTH_USERNAME ?? 'admin',
    password: process.env.ADMIN_AUTH_PASSWORD ?? 'admin123',
  };

  const getAuthToken = async () => {
    const loginResponse = await request(app).post('/api/v1/admin/auth/login').send(loginPayload);
    return loginResponse.body.data.token;
  };

  test('GET /health', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('GET /api/v1/admin/products', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.products)).toBe(true);
  });

  test('GET /api/v1/admin/products/options', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .get('/api/v1/admin/products/options')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.categories)).toBe(true);
    expect(Array.isArray(response.body.data.colors)).toBe(true);
    expect(Array.isArray(response.body.data.sizes)).toBe(true);
  });

  test('POST /api/v1/admin/auth/login returns token', async () => {
    const response = await request(app).post('/api/v1/admin/auth/login').send(loginPayload);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(typeof response.body.data.token).toBe('string');
  });

  test('POST /api/v1/admin/auth/login returns 401 for invalid credentials', async () => {
    const response = await request(app).post('/api/v1/admin/auth/login').send({
      username: 'invalid',
      password: 'invalid',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/v1/admin/products returns 401 without auth token', async () => {
    const response = await request(app).get('/api/v1/admin/products');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/v1/admin/products, /products/options and /categories accept the public read-only token', async () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';

    const products = await request(app)
      .get('/api/v1/admin/products')
      .set('Authorization', `Bearer ${publicToken}`);
    expect(products.status).toBe(200);
    expect(Array.isArray(products.body.data.products)).toBe(true);

    const options = await request(app)
      .get('/api/v1/admin/products/options')
      .set('Authorization', `Bearer ${publicToken}`);
    expect(options.status).toBe(200);

    const categories = await request(app)
      .get('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${publicToken}`);
    expect(categories.status).toBe(200);
    expect(Array.isArray(categories.body.data.categories)).toBe(true);
  });

  test('GET /api/v1/admin/products/:id returns product detail with the public read-only token', async () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';

    const found = await request(app)
      .get('/api/v1/admin/products/SKU-001')
      .set('Authorization', `Bearer ${publicToken}`);
    expect(found.status).toBe(200);
    expect(found.body.data.product.id).toBe('SKU-001');

    const missing = await request(app)
      .get('/api/v1/admin/products/NOT-FOUND')
      .set('Authorization', `Bearer ${publicToken}`);
    expect(missing.status).toBe(404);
  });

  test('GET /api/v1/admin/products supports category, maxPrice and featured filters', async () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';

    const filtered = await request(app)
      .get('/api/v1/admin/products')
      .query({ category: 'electronica', maxPrice: 300 })
      .set('Authorization', `Bearer ${publicToken}`);

    expect(filtered.status).toBe(200);
    expect(filtered.body.data.products).toHaveLength(1);
    expect(filtered.body.data.products[0].id).toBe('SKU-001');
  });

  test('GET /api/v1/admin/products supports status filter for the storefront', async () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';

    const filtered = await request(app)
      .get('/api/v1/admin/products')
      .query({ status: 'active' })
      .set('Authorization', `Bearer ${publicToken}`);

    expect(filtered.status).toBe(200);
    expect(filtered.body.data.products.every((product) => product.status === 'active')).toBe(true);
  });

  test('POST /api/v1/admin/products/register-checkout ranks featured products by checkout frequency', async () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';

    await request(app)
      .post('/api/v1/admin/products/register-checkout')
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ items: [{ productId: 'SKU-003', quantity: 3 }] });

    await request(app)
      .post('/api/v1/admin/products/register-checkout')
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ items: [{ productId: 'SKU-001', quantity: 1 }] });

    const response = await request(app)
      .get('/api/v1/admin/products')
      .query({ featured: 'true' })
      .set('Authorization', `Bearer ${publicToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.products[0].id).toBe('SKU-003');
    expect(response.body.data.products[0].featured).toBe(true);
  });

  test('GET /api/v1/admin/stores/pickup accepts the public read-only token and filters unavailable stores', async () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';

    const unauthenticated = await request(app).get('/api/v1/admin/stores/pickup');
    expect(unauthenticated.status).toBe(401);

    const response = await request(app)
      .get('/api/v1/admin/stores/pickup')
      .set('Authorization', `Bearer ${publicToken}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.stores)).toBe(true);
    expect(
      response.body.data.stores.every((store) => store.active && store.pickupEnabled),
    ).toBe(true);
  });

  test('GET /api/v1/admin/stores/pickup/:id returns a single eligible store, 404s otherwise', async () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';
    const list = await request(app)
      .get('/api/v1/admin/stores/pickup')
      .set('Authorization', `Bearer ${publicToken}`);
    const [eligibleStore] = list.body.data.stores;

    const found = await request(app)
      .get(`/api/v1/admin/stores/pickup/${eligibleStore.id}`)
      .set('Authorization', `Bearer ${publicToken}`);
    expect(found.status).toBe(200);
    expect(found.body.data.store.id).toBe(eligibleStore.id);

    const notFound = await request(app)
      .get('/api/v1/admin/stores/pickup/does-not-exist')
      .set('Authorization', `Bearer ${publicToken}`);
    expect(notFound.status).toBe(404);
  });

  test('POST /api/v1/admin/products rejects the public read-only token', async () => {
    const publicToken = process.env.PUBLIC_API_TOKEN ?? 'trini-public-readonly-token';

    const response = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${publicToken}`)
      .send({ name: 'Polo Publico' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('POST /api/v1/admin/products', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Polo Admin',
      sku: 'PL-ADM-01',
      variantGroup: 'POLO-BASE',
      category: 'polos',
      description: 'Polo de prueba para operaciones admin',
      imageUrl: 'https://picsum.photos/seed/admin-polo/900/1200',
      price: 59.9,
      currency: 'PEN',
      stock: 20,
      featured: true,
      status: 'active',
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('PUT /api/v1/admin/products/:id', async () => {
    const token = await getAuthToken();
    const created = await request(app)
      .post('/api/v1/admin/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Producto Editar',
      sku: 'EDIT-01',
      variantGroup: 'EDIT-BASE',
      category: 'polos',
      description: 'base',
      imageUrl: 'https://picsum.photos/seed/edit-product/900/1200',
      price: 44.5,
      currency: 'PEN',
      stock: 10,
      featured: false,
      status: 'active',
    });

    const productId = created.body.data.product.id;

    const updated = await request(app)
      .put(`/api/v1/admin/products/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Producto Editado',
      sku: 'EDIT-01',
      variantGroup: 'EDIT-BASE',
      category: 'polos',
      description: 'actualizado',
      imageUrl: 'https://picsum.photos/seed/edit-product-2/900/1200',
      price: 49.9,
      currency: 'PEN',
      stock: 8,
      featured: true,
      status: 'inactive',
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.product.name).toBe('Producto Editado');
    expect(updated.body.data.product.status).toBe('inactive');
  });

  test('PUT /api/v1/admin/products/:id returns 404 when not found', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .put('/api/v1/admin/products/product-missing')
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Producto X',
      sku: 'PX-01',
      variantGroup: 'PX-BASE',
      category: 'polos',
      description: 'x',
      imageUrl: 'https://picsum.photos/seed/p-x/900/1200',
      price: 10,
      currency: 'PEN',
      stock: 1,
      featured: false,
      status: 'active',
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('POST /api/v1/admin/internal-users', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .post('/api/v1/admin/internal-users')
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Supervisor Uno',
      email: 'supervisor@trini.local',
      role: 'operator',
      active: true,
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('GET /api/v1/admin/categories', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .get('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.categories)).toBe(true);
  });

  test('POST /api/v1/admin/categories', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Polos',
      slug: 'polos',
      description: 'Categoria para polos de temporada',
      active: true,
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  test('PUT /api/v1/admin/categories/:id', async () => {
    const token = await getAuthToken();
    const created = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Categoria Editar',
      slug: 'categoria-editar',
      description: 'base',
      active: true,
    });

    const categoryId = created.body.data.category.id;

    const updated = await request(app)
      .put(`/api/v1/admin/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Categoria Editada',
      slug: 'categoria-editada',
      description: 'actualizada',
      active: false,
    });

    expect(updated.status).toBe(200);
    expect(updated.body.data.category.name).toBe('Categoria Editada');
    expect(updated.body.data.category.active).toBe(false);
  });

  test('PUT /api/v1/admin/categories/:id returns 404 when not found', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .put('/api/v1/admin/categories/category-missing')
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Categoria X',
      slug: 'categoria-x',
      description: 'x',
      active: true,
    });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  test('POST /api/v1/admin/categories returns 400 for invalid slug format', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
      name: 'Camisas Formales',
      slug: 'Camisas Formales',
      description: 'Slug invalido por espacios y mayusculas',
      active: true,
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('BUSINESS_ERROR');
  });

  test('POST /api/v1/admin/categories returns 400 for duplicated slug', async () => {
    const token = await getAuthToken();
    const payload = {
      name: 'Blazers',
      slug: 'blazers',
      description: 'Categoria para blazers',
      active: true,
    };

    const first = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(duplicate.status).toBe(400);
    expect(duplicate.body.success).toBe(false);
    expect(duplicate.body.error.code).toBe('BUSINESS_ERROR');
  });

  test('GET /api/v1/admin/stores', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .get('/api/v1/admin/stores')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.stores)).toBe(true);
  });

  test('POST /api/v1/admin/stores', async () => {
    const token = await getAuthToken();
    const response = await request(app)
      .post('/api/v1/admin/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Trini Barranco',
        slug: 'trini-barranco',
        address: 'Av. Bolognesi 220',
        district: 'Barranco',
        reference: 'Frente a la plaza',
        pickupEnabled: true,
        courierEnabled: true,
        active: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.store.slug).toBe('trini-barranco');
  });

  test('PUT /api/v1/admin/stores/:id', async () => {
    const token = await getAuthToken();
    const created = await request(app)
      .post('/api/v1/admin/stores')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Trini Centro',
        slug: 'trini-centro',
        address: 'Jr. de la Union 100',
        district: 'Cercado de Lima',
        reference: 'Cerca a la plaza',
        pickupEnabled: true,
        courierEnabled: false,
        active: true,
      });

    const storeId = created.body.data.store.id;

    const updated = await request(app)
      .put(`/api/v1/admin/stores/${storeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Trini Centro Actualizada',
        slug: 'trini-centro',
        address: 'Jr. de la Union 100',
        district: 'Cercado de Lima',
        reference: 'Puerta principal',
        pickupEnabled: true,
        courierEnabled: true,
        active: true,
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data.store.name).toBe('Trini Centro Actualizada');
    expect(updated.body.data.store.courierEnabled).toBe(true);
  });
});
