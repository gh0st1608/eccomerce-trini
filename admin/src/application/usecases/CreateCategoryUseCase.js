import { randomUUID } from 'node:crypto';
import { BusinessError } from '../../domain/exceptions/index.js';
import { prepareCategoryImageForStorage } from '../services/prepareCategoryImageForStorage.js';
import { createCategorySlug } from '../../shared/utils/category-slug.js';

const SLUG_PATTERN = /^[a-z0-9ñ]+(?:-[a-z0-9ñ]+)*$/;

export class CreateCategoryUseCase {
  constructor({ categoryRepository, productImageStorage = null }) {
    this.categoryRepository = categoryRepository;
    this.productImageStorage = productImageStorage;
  }

  async execute(payload) {
    const categoryId = randomUUID();
    const normalizedPayload = { ...payload, id: categoryId, slug: createCategorySlug(payload.name) };

    if (!SLUG_PATTERN.test(normalizedPayload.slug)) {
      throw new BusinessError('Invalid category slug format');
    }

    const existing = await this.categoryRepository.findBySlug(normalizedPayload.slug);
    if (existing) {
      throw new BusinessError('Category slug already exists');
    }

    if (normalizedPayload.parentId) {
      const parent = await this.categoryRepository.findById(normalizedPayload.parentId);
      if (!parent || parent.parentId) {
        throw new BusinessError('Parent category must be an existing general category');
      }
    }

    const preparedPayload = await prepareCategoryImageForStorage({
      payload: normalizedPayload,
      categoryId,
      productImageStorage: this.productImageStorage,
    });
    return this.categoryRepository.create(preparedPayload);
  }
}
