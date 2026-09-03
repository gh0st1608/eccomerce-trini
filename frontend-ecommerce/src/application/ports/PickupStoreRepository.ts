import type { PickupStore } from '@domain/entities/PickupStore'

export interface PickupStoreRepository {
  listPickupStores(): Promise<PickupStore[]>
}
