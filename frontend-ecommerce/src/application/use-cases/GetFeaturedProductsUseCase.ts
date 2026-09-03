import type { Product } from '@domain/entities/Product'
import type { ProductRepository } from '@application/ports/ProductRepository'

export class GetFeaturedProductsUseCase {
  private readonly productRepository: ProductRepository

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository
  }

  async execute(): Promise<Product[]> {
    return await this.productRepository.findFeatured()
  }
}
