import { BusinessError, NotFoundError } from '../../domain/exceptions/index.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class UpdateCategoryUseCase {
  constructor({ categoryRepository }) {
    this.categoryRepository = categoryRepository;
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

    return this.categoryRepository.update(id, payload);
  }
}
