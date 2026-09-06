import { describe, expect, it } from 'vitest'
import { getProductGalleryImages } from '@shared/utils/productGallery'

describe('getProductGalleryImages', () => {
  it('includes the storefront image first and removes gallery duplicates', () => {
    const gallery = getProductGalleryImages({
      id: 'product-gallery',
      name: 'Producto con galeria',
      description: '',
      category: 'camisas',
      imageUrl: 'https://cdn.example.com/storefront.webp',
      images: [
        'https://cdn.example.com/detail.webp',
        'https://cdn.example.com/storefront.webp',
      ],
      price: 120,
      featured: false,
    })

    expect(gallery).toEqual([
      'https://cdn.example.com/storefront.webp',
      'https://cdn.example.com/detail.webp',
    ])
  })
})