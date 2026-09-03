import type { PickupStore } from '@domain/entities/PickupStore'
import type { PickupStoreRepository } from '@application/ports/PickupStoreRepository'

export class ListPickupStoresUseCase {
  private readonly pickupStoreRepository: PickupStoreRepository

  constructor(pickupStoreRepository: PickupStoreRepository) {
    this.pickupStoreRepository = pickupStoreRepository
  }

  async execute(): Promise<PickupStore[]> {
    return await this.pickupStoreRepository.listPickupStores()
  }
}
