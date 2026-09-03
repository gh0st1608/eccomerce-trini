import type { Product } from '@domain/entities/Product'

export interface ProductRepository {
  findFeatured(): Promise<Product[]>
  findById(id: string): Promise<Product | null>
}
