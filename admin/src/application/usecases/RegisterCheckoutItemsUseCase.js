export class RegisterCheckoutItemsUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(items) {
    return this.productRepository.registerCheckoutItems(items);
  }
}
