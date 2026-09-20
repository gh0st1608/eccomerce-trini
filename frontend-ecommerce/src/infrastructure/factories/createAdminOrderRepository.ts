import type { AdminOrderRepository } from '@application/ports/AdminOrderRepository'
import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpAdminOrderRepository } from '@infrastructure/repositories/HttpAdminOrderRepository'
import { getAdminAuthToken } from '@shared/utils/adminAuth'

export function createAdminOrderRepository(): AdminOrderRepository {
  const httpClient = new FetchHttpClient({
    baseUrl: env.VITE_ADMIN_API_BASE_URL,
    getAuthorizationHeader: () => {
      const token = getAdminAuthToken()
      return token ? `Bearer ${token}` : null
    },
  })

  return new HttpAdminOrderRepository(httpClient)
}
