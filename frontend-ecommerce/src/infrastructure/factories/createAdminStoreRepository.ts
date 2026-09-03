import type { AdminStoreRepository } from '@application/ports/AdminStoreRepository'
import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpAdminStoreRepository } from '@infrastructure/repositories/HttpAdminStoreRepository'
import { getAdminAuthToken } from '@shared/utils/adminAuth'

export function createAdminStoreRepository(): AdminStoreRepository {
  const httpClient = new FetchHttpClient({
    baseUrl: env.VITE_ADMIN_API_BASE_URL,
    getAuthorizationHeader: () => {
      const token = getAdminAuthToken()
      return token ? `Bearer ${token}` : null
    },
  })

  return new HttpAdminStoreRepository(httpClient)
}
