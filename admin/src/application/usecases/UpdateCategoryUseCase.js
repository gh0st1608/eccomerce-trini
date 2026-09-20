import { BusinessError, NotFoundError } from '../../domain/exceptions/index.js';
import { prepareCategoryImageForStorage } from '../services/prepareCategoryImageForStorage.js';
import { createCategorySlug } from '../../shared/utils/category-slug.js';

const SLUG_PATTERN = /^[a-z0-9ñ]+(?:-[a-z0-9ñ]+)*$/;

export class UpdateCategoryUseCase {
  constructor({ categoryRepository, productImageStorage = null }) {
    this.categoryRepository = categoryRepository;
    this.productImageStorage = productImageStorage;
  }

  async execute(id, payload) {
    const normalizedPayload = { ...payload, slug: createCategorySlug(payload.name) };

    if (!SLUG_PATTERN.test(normalizedPayload.slug)) {
      throw new BusinessError('Invalid category slug format');
    }

    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category not found');
    }

    const categoryWithSlug = await this.categoryRepository.findBySlug(normalizedPayload.slug);
    if (categoryWithSlug && categoryWithSlug.id !== id) {
      throw new BusinessError('Category slug already exists');
    }

    if (normalizedPayload.parentId) {
      if (normalizedPayload.parentId === id) {
        throw new BusinessError('Category cannot be its own parent');
      }

      const parent = await this.categoryRepository.findById(normalizedPayload.parentId);
      if (!parent || parent.parentId) {
        throw new BusinessError('Parent category must be an existing general category');
      }
    }

    const preparedPayload = await prepareCategoryImageForStorage({
      payload: normalizedPayload,
      categoryId: id,
      productImageStorage: this.productImageStorage,
    });
    return this.categoryRepository.update(id, preparedPayload);
  }
}
