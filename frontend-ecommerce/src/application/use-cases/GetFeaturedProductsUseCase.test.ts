import { describe, expect, it } from 'vitest'
import { GetFeaturedProductsUseCase } from '@application/use-cases/GetFeaturedProductsUseCase'
import type { ProductRepository } from '@application/ports/ProductRepository'

const repositoryStub: ProductRepository = {
  findFeatured: async () => [
    {
      id: 'TR-001',
      name: 'Chaqueta Atlas',
      description: 'Desc',
      category: 'Outerwear',
      imageUrl: 'https://example.com/image.jpg',
      price: 180,
      featured: true,
    },
  ],
  findById: async () => null,
}

describe('GetFeaturedProductsUseCase', () => {
  it('returns featured products from repository', async () => {
    const useCase = new GetFeaturedProductsUseCase(repositoryStub)

    const result = await useCase.execute()

    expect(result).toHaveLength(1)
    expect(result[0].featured).toBe(true)
  })
})
