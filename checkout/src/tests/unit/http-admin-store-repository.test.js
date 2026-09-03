import { jest } from '@jest/globals';
import { HttpAdminStoreRepository } from '../../infrastructure/repositories/HttpAdminStoreRepository.js';

describe('HttpAdminStoreRepository', () => {
  test('findById fetches a pickup-eligible store from the admin API', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: { store: { id: 'store-001', active: true, pickupEnabled: true } } }),
    });
    const repository = new HttpAdminStoreRepository({
      baseUrl: 'http://admin-api:3001/api/v1/admin',
      token: 'public-token',
    });

    try {
      const store = await repository.findById('store-001');

      expect(store).toEqual({ id: 'store-001', active: true, pickupEnabled: true });
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://admin-api:3001/api/v1/admin/stores/pickup/store-001',
        expect.objectContaining({ headers: { authorization: 'Bearer public-token' } }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('findById returns null when the admin API responds with 404', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false });
    const repository = new HttpAdminStoreRepository({
      baseUrl: 'http://admin-api:3001/api/v1/admin',
      token: 'public-token',
    });

    try {
      await expect(repository.findById('store-missing')).resolves.toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test('findById returns null when the admin API is unreachable', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network error'));
    const repository = new HttpAdminStoreRepository({
      baseUrl: 'http://admin-api:3001/api/v1/admin',
      token: 'public-token',
    });

    try {
      await expect(repository.findById('store-001')).resolves.toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
