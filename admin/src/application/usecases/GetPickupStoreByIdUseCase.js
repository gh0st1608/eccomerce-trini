export class GetPickupStoreByIdUseCase {
  constructor({ storeRepository }) {
    this.storeRepository = storeRepository;
  }

  async execute(id) {
    const store = await this.storeRepository.findById(id);

    if (!store || !store.active || !store.pickupEnabled) {
      return null;
    }

    return store;
  }
}
