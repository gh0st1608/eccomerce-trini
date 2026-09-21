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

  it('shows the selected color images followed by the complete product gallery', () => {
    const product = {
      id: 'product-colors',
      name: 'Producto por color',
      description: '',
      category: 'vestidos',
      imageUrl: 'https://cdn.example.com/general.webp',
      images: [
        'https://cdn.example.com/detail.webp',
        'https://cdn.example.com/vino-front.webp',
      ],
      colorOptions: [
        {
          name: 'Vino',
          hex: '#722f37',
          images: ['https://cdn.example.com/vino-front.webp', 'https://cdn.example.com/vino-back.webp'],
        },
      ],
      price: 120,
      featured: false,
    }

    expect(getProductGalleryImages(product, 'Vino')).toEqual([
      'https://cdn.example.com/vino-front.webp',
      'https://cdn.example.com/vino-back.webp',
      'https://cdn.example.com/general.webp',
      'https://cdn.example.com/detail.webp',
    ])
    expect(getProductGalleryImages(product, 'Negro')).toEqual([
      'https://cdn.example.com/general.webp',
      'https://cdn.example.com/detail.webp',
      'https://cdn.example.com/vino-front.webp',
    ])
  })
})