import { BusinessError, NotFoundError } from '../../domain/exceptions/index.js';
import { prepareProductImagesForStorage } from '../services/prepareProductImagesForStorage.js';

export class UpdateProductUseCase {
  constructor({ productRepository, productImageStorage = null }) {
    this.productRepository = productRepository;
    this.productImageStorage = productImageStorage;
  }

  async execute(id, payload) {
    if (payload.stock < 0) {
      throw new BusinessError('Stock cannot be negative');
    }

    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    const payloadWithStoredImages = await prepareProductImagesForStorage({
      payload,
      productImageStorage: this.productImageStorage,
    });

    return this.productRepository.update(id, payloadWithStoredImages);
  }
}
