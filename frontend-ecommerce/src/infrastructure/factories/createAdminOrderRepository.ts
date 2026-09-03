import type { AdminOrderRepository } from '@application/ports/AdminOrderRepository'
import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpAdminOrderRepository } from '@infrastructure/repositories/HttpAdminOrderRepository'

export function createAdminOrderRepository(): AdminOrderRepository {
  const httpClient = new FetchHttpClient({
    baseUrl: env.VITE_ECOMMERCE_API_BASE_URL,
  })

  return new HttpAdminOrderRepository(httpClient)
}
