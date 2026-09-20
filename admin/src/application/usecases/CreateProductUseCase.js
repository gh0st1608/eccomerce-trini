import { randomUUID } from 'node:crypto';
import { BusinessError } from '../../domain/exceptions/index.js';
import { prepareProductImagesForStorage } from '../services/prepareProductImagesForStorage.js';

export class CreateProductUseCase {
  constructor({ productRepository, productImageStorage = null }) {
    this.productRepository = productRepository;
    this.productImageStorage = productImageStorage;
  }

  async execute(payload) {
    if (payload.stock < 0) {
      throw new BusinessError('Stock cannot be negative');
    }

    const productId = randomUUID();
    const payloadWithId = { ...payload, id: productId };
    const payloadWithStoredImages = await prepareProductImagesForStorage({
      payload: payloadWithId,
      productId,
      productImageStorage: this.productImageStorage,
    });

    return this.productRepository.create(payloadWithStoredImages);
  }
}
