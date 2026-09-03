import type { AdminCategoryRepository } from '@application/ports/AdminCategoryRepository'
import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpAdminCategoryRepository } from '@infrastructure/repositories/HttpAdminCategoryRepository'
import { getAdminAuthToken } from '@shared/utils/adminAuth'

export function createAdminCategoryRepository(): AdminCategoryRepository {
  const httpClient = new FetchHttpClient({
    baseUrl: env.VITE_ADMIN_API_BASE_URL,
    getAuthorizationHeader: () => {
      const token = getAdminAuthToken()
      return token ? `Bearer ${token}` : null
    },
  })

  return new HttpAdminCategoryRepository(httpClient)
}
