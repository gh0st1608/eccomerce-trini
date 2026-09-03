import type { AdminProductRepository } from '@application/ports/AdminProductRepository'
import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpAdminProductRepository } from '@infrastructure/repositories/HttpAdminProductRepository'
import { getAdminAuthToken } from '@shared/utils/adminAuth'

export function createAdminProductRepository(): AdminProductRepository {
  const httpClient = new FetchHttpClient({
    baseUrl: env.VITE_ADMIN_API_BASE_URL,
    getAuthorizationHeader: () => {
      const token = getAdminAuthToken()
      return token ? `Bearer ${token}` : null
    },
  })

  return new HttpAdminProductRepository(httpClient)
}
