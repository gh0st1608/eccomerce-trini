import { BusinessError, NotFoundError } from '../../domain/exceptions/index.js';

export class DeleteProductUseCase {
  constructor({ productRepository }) {
    this.productRepository = productRepository;
  }

  async execute(id) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.status !== 'inactive') {
      throw new BusinessError('Only inactive products can be deleted');
    }

    await this.productRepository.delete(id);
  }
}