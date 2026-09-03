import { describe, expect, it, vi } from 'vitest'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import { HttpPickupStoreRepository } from '@infrastructure/repositories/HttpPickupStoreRepository'

describe('HttpPickupStoreRepository', () => {
  it('fetches pickup stores from the public admin endpoint and filters unavailable ones', async () => {
    const get = vi.fn().mockResolvedValue({
      data: {
        stores: [
          { id: 'store-001', name: 'Trini Miraflores', address: 'Av. Larco 512', district: 'Miraflores', active: true, pickupEnabled: true },
          { id: 'store-003', name: 'Trini Surco', address: 'Jr. Monte Azul 120', district: 'Surco', active: true, pickupEnabled: false },
        ],
      },
    })
    const httpClient: HttpClient = { get, post: vi.fn(), put: vi.fn() }
    const repository = new HttpPickupStoreRepository(httpClient)

    const stores = await repository.listPickupStores()

    expect(get).toHaveBeenCalledWith('/stores/pickup')
    expect(stores).toHaveLength(1)
    expect(stores[0].id).toBe('store-001')
  })
})
