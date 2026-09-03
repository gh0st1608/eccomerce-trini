import type { PickupStoreRepository } from '@application/ports/PickupStoreRepository'
import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpPickupStoreRepository } from '@infrastructure/repositories/HttpPickupStoreRepository'

export function createPickupStoreRepository(): PickupStoreRepository {
  const httpClient = new FetchHttpClient({
    baseUrl: env.VITE_ADMIN_API_BASE_URL,
    getAuthorizationHeader: () => (env.VITE_PUBLIC_API_TOKEN ? `Bearer ${env.VITE_PUBLIC_API_TOKEN}` : null),
  })

  return new HttpPickupStoreRepository(httpClient)
}
