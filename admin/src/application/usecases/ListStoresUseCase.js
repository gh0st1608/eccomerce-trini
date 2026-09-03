export class ListStoresUseCase {
  constructor({ storeRepository }) {
    this.storeRepository = storeRepository;
  }

  async execute() {
    return this.storeRepository.list();
  }
}
