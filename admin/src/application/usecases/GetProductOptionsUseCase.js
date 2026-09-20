export class GetProductOptionsUseCase {
  constructor({ productRepository, categoryRepository, storefrontSettingsRepository }) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.storefrontSettingsRepository = storefrontSettingsRepository;
  }

  async execute() {
    const [optionCatalog, categories, settings] = await Promise.all([
      this.productRepository.getOptionCatalog(),
      this.categoryRepository.list(),
      this.storefrontSettingsRepository.get(),
    ]);

    return {
      colors: [...new Set([...settings.catalogOptions.colors, ...optionCatalog.colors])],
      sizes: [...new Set([...settings.catalogOptions.sizes, ...optionCatalog.sizes])],
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
