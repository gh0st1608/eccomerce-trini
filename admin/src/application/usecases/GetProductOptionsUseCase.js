export class GetProductOptionsUseCase {
  constructor({ productRepository, categoryRepository }) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
  }

  async execute() {
    const [optionCatalog, categories] = await Promise.all([
      this.productRepository.getOptionCatalog(),
      this.categoryRepository.list(),
    ]);

    return {
      colors: optionCatalog.colors,
      sizes: optionCatalog.sizes,
      productTypes: optionCatalog.productTypes ?? [],
      attributeNames: optionCatalog.attributeNames ?? [],
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        active: category.active,
      })),
    };
  }
}
