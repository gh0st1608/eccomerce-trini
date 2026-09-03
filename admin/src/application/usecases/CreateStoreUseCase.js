import { BusinessError } from '../../domain/exceptions/index.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateStoreUseCase {
  constructor({ storeRepository }) {
    this.storeRepository = storeRepository;
  }

  async execute(payload) {
    if (!SLUG_PATTERN.test(payload.slug)) {
      throw new BusinessError('Invalid store slug format');
    }

    if (!payload.pickupEnabled && !payload.courierEnabled) {
      throw new BusinessError('Store must support pickup or courier');
    }

    const existing = await this.storeRepository.findBySlug(payload.slug);
    if (existing) {
      throw new BusinessError('Store slug already exists');
    }

    return this.storeRepository.create(payload);
  }
}
