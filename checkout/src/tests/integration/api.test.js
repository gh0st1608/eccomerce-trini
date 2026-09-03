import request from 'supertest';
import { createApp } from '../../app.js';
import { createContainer } from '../../container.js';

const PRODUCTS_BY_ID = {
  'SKU-001': { id: 'SKU-001', name: 'Smart Speaker Wave Mini', category: 'electronica', imageUrl: 'https://picsum.photos/seed/ecom-speaker/900/1200', price: 249.9 },
  'SKU-003': { id: 'SKU-003', name: 'Set Mancuernas Ajustables 24kg', category: 'deportes', imageUrl: 'https://picsum.photos/seed/ecom-dumbbell/900/1200', price: 529.9 },
};

describe('API integration', () => {
  const fakeProductRepository = {
    findById: async (id) => PRODUCTS_BY_ID[id] ?? null,
    registerCheckoutItems: async () => undefined,
  };
  const fakeStoreRepository = {
    findById: async (id) =>
      (id === 'store-001'
        ? { id: 'store-001', name: 'Trini Miraflores', address: 'Av. Larco 512', district: 'Miraflores', active: true, pickupEnabled: true }
        : null),
  };
  const { logger, controllers } = createContainer({
    overrides: { productRepository: fakeProductRepository, storeRepository: fakeStoreRepository },
  });
  const app = createApp({ logger, controllers });

  test('GET /health returns success', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('POST /api/v1/checkout/whatsapp returns url', async () => {
    const response = await request(app).post('/api/v1/checkout/whatsapp').send({
      items: [{ productId: 'SKU-001', quantity: 1 }],
      customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
      delivery: { method: 'courier' },
    });
    expect(response.status).toBe(201);
    expect(response.body.data.checkoutUrl).toContain('https://wa.me/');
    expect(response.body.data.sharedCartUrl).toContain('/api/v1/checkout/share?token=');

    const sharedUrl = new URL(response.body.data.sharedCartUrl);
    const sharedToken = sharedUrl.searchParams.get('token');

    const sharedResponse = await request(app)
      .get('/api/v1/checkout/shared')
      .query({ token: sharedToken });

    expect(sharedResponse.status).toBe(200);
    expect(sharedResponse.body.data.sharedCheckout.checkout.itemCount).toBe(1);
  });

  test('POST /api/v1/checkout/whatsapp validates pickup storeId against the store repository', async () => {
    const validPickup = await request(app).post('/api/v1/checkout/whatsapp').send({
      items: [{ productId: 'SKU-001', quantity: 1 }],
      customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
      delivery: { method: 'pickup', storeId: 'store-001' },
    });
    expect(validPickup.status).toBe(201);

    const invalidPickup = await request(app).post('/api/v1/checkout/whatsapp').send({
      items: [{ productId: 'SKU-001', quantity: 1 }],
      customer: { phone: '51999999999', firstName: 'Ana', lastName: 'Perez' },
      delivery: { method: 'pickup', storeId: 'store-missing' },
    });
    expect(invalidPickup.status).toBe(400);
  });
});
