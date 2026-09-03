import { BusinessError, NotFoundError } from '../../domain/exceptions/index.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class UpdateStoreUseCase {
  constructor({ storeRepository }) {
    this.storeRepository = storeRepository;
  }

  async execute(id, payload) {
    if (!SLUG_PATTERN.test(payload.slug)) {
      throw new BusinessError('Invalid store slug format');
    }

    if (!payload.pickupEnabled && !payload.courierEnabled) {
      throw new BusinessError('Store must support pickup or courier');
    }

    const existing = await this.storeRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Store not found');
    }

    const storeWithSlug = await this.storeRepository.findBySlug(payload.slug);
    if (storeWithSlug && storeWithSlug.id !== id) {
      throw new BusinessError('Store slug already exists');
    }

    return this.storeRepository.update(id, payload);
  }
}
