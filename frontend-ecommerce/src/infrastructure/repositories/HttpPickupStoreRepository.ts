import type { PickupStore } from '@domain/entities/PickupStore'
import type { PickupStoreRepository } from '@application/ports/PickupStoreRepository'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import { pickupStoresResponseSchema, type PickupStoresResponseDto } from '@infrastructure/dto/PickupStoreDto'

export class HttpPickupStoreRepository implements PickupStoreRepository {
  private readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async listPickupStores(): Promise<PickupStore[]> {
    const response = await this.httpClient.get<PickupStoresResponseDto>('/stores/pickup')
    const parsed = pickupStoresResponseSchema.parse(response)

    return parsed.data.stores
      .filter((store) => store.active && store.pickupEnabled)
      .map((store) => ({
        id: store.id,
        name: store.name,
        address: store.address,
        district: store.district,
        active: store.active,
        pickupEnabled: store.pickupEnabled,
      }))
  }
}
