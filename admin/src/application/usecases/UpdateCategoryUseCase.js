import { BusinessError, NotFoundError } from '../../domain/exceptions/index.js';
import { prepareCategoryImageForStorage } from '../services/prepareCategoryImageForStorage.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class UpdateCategoryUseCase {
  constructor({ categoryRepository, productImageStorage = null }) {
    this.categoryRepository = categoryRepository;
    this.productImageStorage = productImageStorage;
  }

  async execute(id, payload) {
    if (!SLUG_PATTERN.test(payload.slug)) {
      throw new BusinessError('Invalid category slug format');
    }

    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    const categoryWithSlug = await this.categoryRepository.findBySlug(payload.slug);
    if (categoryWithSlug && categoryWithSlug.id !== id) {
      throw new BusinessError('Category slug already exists');
    }

    if (payload.parentId) {
      if (payload.parentId === id) {
        throw new BusinessError('Category cannot be its own parent');
      }

      const parent = await this.categoryRepository.findById(payload.parentId);
      if (!parent || parent.parentId) {
        throw new BusinessError('Parent category must be an existing general category');
      }
    }

    const preparedPayload = await prepareCategoryImageForStorage({
      payload,
      productImageStorage: this.productImageStorage,
    });
    return this.categoryRepository.update(id, preparedPayload);
  }
}
