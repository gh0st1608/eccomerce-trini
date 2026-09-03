import type { ProductRepository } from '@application/ports/ProductRepository'
import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpProductRepository } from '@infrastructure/repositories/HttpProductRepository'

export function createProductRepository(): ProductRepository {
  const httpClient = new FetchHttpClient({
    baseUrl: env.VITE_ADMIN_API_BASE_URL,
    getAuthorizationHeader: () => (env.VITE_PUBLIC_API_TOKEN ? `Bearer ${env.VITE_PUBLIC_API_TOKEN}` : null),
  })

  return new HttpProductRepository(httpClient)
}
