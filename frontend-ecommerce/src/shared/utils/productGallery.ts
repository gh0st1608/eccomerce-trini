import type { Product } from '@domain/entities/Product'

export interface ProductGalleryItem {
  imageUrl: string
  color?: string
}

export function getProductGalleryItems(product: Product): ProductGalleryItem[] {
  const items: ProductGalleryItem[] = product.colorOptions?.flatMap((option) =>
    option.images.filter(Boolean).map((imageUrl) => ({ imageUrl, color: option.name })),
  ) ?? []
  const seenImages = new Set(items.map((item) => item.imageUrl))

  for (const imageUrl of [product.imageUrl, ...(product.images ?? [])].filter(Boolean)) {
    if (!seenImages.has(imageUrl)) {
      items.push({ imageUrl })
      seenImages.add(imageUrl)
    }
  }

  return items
}

export function getProductGalleryImages(product: Product, selectedColor?: string): string[] {
  const colorImages = product.colorOptions?.find(
    (option) => option.name.toLocaleLowerCase() === selectedColor?.toLocaleLowerCase(),
  )?.images

  return Array.from(
    new Set([...(colorImages ?? []), product.imageUrl, ...(product.images ?? [])].filter(Boolean)),
  )
}