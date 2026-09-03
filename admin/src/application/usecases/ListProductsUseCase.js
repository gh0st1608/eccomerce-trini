export class ListProductsUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(filters = {}) {
    return this.productRepository.list(filters);
  }
}
