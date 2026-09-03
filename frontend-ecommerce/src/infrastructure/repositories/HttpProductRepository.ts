import type { Product } from '@domain/entities/Product'
import type { ProductRepository } from '@application/ports/ProductRepository'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import {
  mapProductDetailResponseToDomain,
  mapProductsApiResponseToDomain,
} from '@infrastructure/mappers/productMapper'
import type { ProductDetailResponse, ProductsApiResponse } from '@infrastructure/dto/ProductDto'

export class HttpProductRepository implements ProductRepository {
  private readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async findFeatured(): Promise<Product[]> {
    const response = await this.httpClient.get<ProductsApiResponse>('/products?status=active')
    return mapProductsApiResponseToDomain(response)
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const response = await this.httpClient.get<ProductDetailResponse>(`/products/${id}`)
      return mapProductDetailResponseToDomain(response)
    } catch {
      return null
    }
  }
}
