import { jest } from '@jest/globals';
import { HttpAdminOrderClient } from '../../infrastructure/clients/HttpAdminOrderClient.js';

describe('HttpAdminOrderClient', () => {
  test('creates an order through the protected admin endpoint', async () => {
    const originalFetch = globalThis.fetch;
    const order = { checkoutUrl: 'https://wa.me/1', itemCount: 2, subtotal: 120 };
    const persistedOrder = { ...order, id: 'order-1' };
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: { order: persistedOrder } }),
    });
    const client = new HttpAdminOrderClient({
      baseUrl: 'http://admin-api:3001/api/v1/admin',
      token: 'checkout-service-token',
    });

    try {
      await expect(client.create(order)).resolves.toEqual(persistedOrder);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://admin-api:3001/api/v1/admin/orders',
        expect.objectContaining({
          method: 'POST',
          headers: {
            authorization: 'Bearer checkout-service-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify(order),
          signal: expect.any(Object),
        }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('rejects when the admin API does not accept the order', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    const client = new HttpAdminOrderClient({
      baseUrl: 'http://admin-api:3001/api/v1/admin',
      token: 'checkout-service-token',
    });

    try {
      await expect(client.create({ checkoutUrl: 'https://wa.me/1' }))
        .rejects.toThrow('Admin order API returned HTTP 503');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});