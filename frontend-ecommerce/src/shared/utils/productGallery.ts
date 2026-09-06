import type { Product } from '@domain/entities/Product'

export function getProductGalleryImages(product: Product): string[] {
  return Array.from(new Set([product.imageUrl, ...(product.images ?? [])].filter(Boolean)))
}