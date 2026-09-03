import type { Product } from '@domain/entities/Product'
import type { ProductRepository } from '@application/ports/ProductRepository'

export class GetProductByIdUseCase {
  private readonly productRepository: ProductRepository

  constructor(productRepository: ProductRepository) {
    this.productRepository = productRepository
  }

  async execute(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id)
  }
}