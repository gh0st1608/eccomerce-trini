import type { CategoryRepository } from '@application/ports/CategoryRepository'
import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpAdminCategoryRepository } from '@infrastructure/repositories/HttpAdminCategoryRepository'

export function createCategoryRepository(): CategoryRepository {
  const httpClient = new FetchHttpClient({
    baseUrl: env.VITE_ADMIN_API_BASE_URL,
    getAuthorizationHeader: () =>
      env.VITE_PUBLIC_API_TOKEN ? `Bearer ${env.VITE_PUBLIC_API_TOKEN}` : null,
  })

  return new HttpAdminCategoryRepository(httpClient)
}
