export class ListPickupStoresUseCase {
  constructor({ storeRepository }) {
    this.storeRepository = storeRepository;
  }

  async execute() {
    return this.storeRepository.listPickupAvailable();
  }
}
