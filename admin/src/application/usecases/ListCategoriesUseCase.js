export class ListCategoriesUseCase {
  constructor({ categoryRepository }) {
    this.categoryRepository = categoryRepository;
  }

  async execute() {
    return this.categoryRepository.list();
  }
}
