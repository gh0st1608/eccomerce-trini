import { describe, expect, it, vi } from 'vitest'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import { HttpAdminOrderRepository } from '@infrastructure/repositories/HttpAdminOrderRepository'

const order = {
  id: 'order-1',
  createdAt: '2026-09-20T10:00:00.000Z',
  checkoutUrl: 'https://wa.me/51999999999?text=pedido',
  status: 'active' as const,
  paymentStatus: 'pending' as const,
  customerPhone: '999999999',
  referenceFirstName: 'Ana',
  referenceLastName: 'Perez Gomez',
  itemCount: 1,
  subtotal: 45,
  source: 'api' as const,
  items: [],
}

describe('HttpAdminOrderRepository', () => {
  it('lists and updates persisted orders through the admin API', async () => {
    const httpClient: HttpClient = {
      get: vi.fn().mockResolvedValue({ data: { orders: [order] } }),
      post: vi.fn(),
      put: vi.fn().mockResolvedValue({ data: { order: { ...order, paymentStatus: 'paid' } } }),
      delete: vi.fn(),
    }
    const repository = new HttpAdminOrderRepository(httpClient)

    await expect(repository.list()).resolves.toEqual([order])
    await expect(repository.update('order-1', { paymentStatus: 'paid' })).resolves.toMatchObject({
      id: 'order-1',
      paymentStatus: 'paid',
    })

    expect(httpClient.get).toHaveBeenCalledWith('/orders')
    expect(httpClient.put).toHaveBeenCalledWith('/orders/order-1', { paymentStatus: 'paid' })
  })

  it('deletes an order through the admin API', async () => {
    const httpClient: HttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    }
    const repository = new HttpAdminOrderRepository(httpClient)

    await repository.delete('order-1')

    expect(httpClient.delete).toHaveBeenCalledWith('/orders/order-1')
  })
})