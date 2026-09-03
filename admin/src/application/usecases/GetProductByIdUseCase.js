export class GetProductByIdUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(id) {
    return this.productRepository.findById(id);
  }
}
