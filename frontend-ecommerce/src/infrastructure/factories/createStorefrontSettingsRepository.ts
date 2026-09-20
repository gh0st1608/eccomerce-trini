import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpStorefrontSettingsRepository } from '@infrastructure/repositories/HttpStorefrontSettingsRepository'
import { getAdminAuthToken } from '@shared/utils/adminAuth'

export function createStorefrontSettingsRepository(admin = false) {
  return new HttpStorefrontSettingsRepository(
    new FetchHttpClient({
      baseUrl: env.VITE_ADMIN_API_BASE_URL,
      getAuthorizationHeader: () => {
        const token = admin ? getAdminAuthToken() : env.VITE_PUBLIC_API_TOKEN
        return token ? `Bearer ${token}` : null
      },
    }),
  )
}