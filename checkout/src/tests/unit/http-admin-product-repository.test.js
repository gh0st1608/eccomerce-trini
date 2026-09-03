import { jest } from '@jest/globals';
import { HttpAdminProductRepository } from '../../infrastructure/repositories/HttpAdminProductRepository.js';

describe('HttpAdminProductRepository', () => {
  test('findById fetches a product from the admin API', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: { product: { id: 'SKU-001', name: 'Item' } } }),
    });
    const repository = new HttpAdminProductRepository({
      baseUrl: 'http://admin-api:3001/api/v1/admin',
      token: 'public-token',
    });

    try {
      const product = await repository.findById('SKU-001');

      expect(product).toEqual({ id: 'SKU-001', name: 'Item' });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://admin-api:3001/api/v1/admin/products/SKU-001',
        expect.objectContaining({ headers: { authorization: 'Bearer public-token' } }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('findById returns null when the admin API fails', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false });
    const repository = new HttpAdminProductRepository({
      baseUrl: 'http://admin-api:3001/api/v1/admin',
      token: 'public-token',
    });

    try {
      await expect(repository.findById('SKU-001')).resolves.toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('registerCheckoutItems posts items to the admin API', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true });
    const repository = new HttpAdminProductRepository({
      baseUrl: 'http://admin-api:3001/api/v1/admin',
      token: 'public-token',
    });
    const items = [{ productId: 'SKU-001', quantity: 2 }];

    try {
      await repository.registerCheckoutItems(items);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://admin-api:3001/api/v1/admin/products/register-checkout',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ items }),
        }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('registerCheckoutItems does not throw when the admin API is unreachable', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network error'));
    const repository = new HttpAdminProductRepository({
      baseUrl: 'http://admin-api:3001/api/v1/admin',
      token: 'public-token',
    });

    try {
      await expect(repository.registerCheckoutItems([])).resolves.toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
