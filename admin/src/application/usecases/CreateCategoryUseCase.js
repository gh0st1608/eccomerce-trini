import { BusinessError } from '../../domain/exceptions/index.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateCategoryUseCase {
  constructor({ categoryRepository }) {
    this.categoryRepository = categoryRepository;
  }

  async execute(payload) {
    if (!SLUG_PATTERN.test(payload.slug)) {
      throw new BusinessError('Invalid category slug format');
    }

    const existing = await this.categoryRepository.findBySlug(payload.slug);
    if (existing) {
      throw new BusinessError('Category slug already exists');
    }

    return this.categoryRepository.create(payload);
  }
}
