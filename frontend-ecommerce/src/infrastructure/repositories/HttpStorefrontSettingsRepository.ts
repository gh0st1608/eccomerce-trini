import type { StorefrontSettingsRepository } from '@application/ports/StorefrontSettingsRepository'
import type { StorefrontSettings } from '@domain/entities/StorefrontSettings'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import {
  storefrontSettingsResponseSchema,
  type StorefrontSettingsResponse,
} from '@infrastructure/dto/StorefrontSettingsDto'

function mapResponse(response: StorefrontSettingsResponse): StorefrontSettings {
  const parsed = storefrontSettingsResponseSchema.parse(response)
  return 'catalogOptions' in parsed ? parsed : parsed.data.settings
}

export class HttpStorefrontSettingsRepository implements StorefrontSettingsRepository {
  private readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async get(): Promise<StorefrontSettings> {
    return mapResponse(await this.httpClient.get('/storefront-settings'))
  }

  async update(settings: StorefrontSettings): Promise<StorefrontSettings> {
    return mapResponse(await this.httpClient.put('/storefront-settings', settings))
  }
}