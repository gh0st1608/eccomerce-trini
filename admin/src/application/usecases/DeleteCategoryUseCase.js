import { BusinessError, NotFoundError } from '../../domain/exceptions/index.js';

export class DeleteCategoryUseCase {
  constructor({ categoryRepository }) {
    this.categoryRepository = categoryRepository;
  }

  async execute(id) {
    const category = await this.categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (category.active) {
      throw new BusinessError('Only inactive categories can be deleted');
    }

    await this.categoryRepository.delete(id);
  }
}