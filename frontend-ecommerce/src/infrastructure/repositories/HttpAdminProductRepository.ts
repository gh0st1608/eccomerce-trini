import type { AdminProductRepository } from '@application/ports/AdminProductRepository'
import type {
  AdminProduct,
  AdminProductOptions,
  CreateAdminProductInput,
  UpdateAdminProductInput,
} from '@domain/entities/AdminProduct'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import {
  adminProductDtoSchema,
  adminProductListResponseSchema,
  adminProductOptionsResponseSchema,
  adminProductSingleResponseSchema,
  type AdminProductDto,
  type AdminProductListResponse,
  type AdminProductOptionsResponse,
  type AdminProductSingleResponse,
} from '@infrastructure/dto/AdminProductDto'

function mapProductDtoToDomain(dto: AdminProductDto): AdminProduct {
  const parsed = adminProductDtoSchema.parse(dto)
  const primaryPrice = parsed.prices?.[0]

  return {
    id: parsed.id,
    name: parsed.name,
    sku: parsed.sku,
    variantGroup: parsed.variantGroup,
    description: parsed.description,
    category: parsed.category ?? parsed.categories?.[0] ?? 'general',
    categories: parsed.categories,
    imageUrl: parsed.imageUrl ?? parsed.images?.[0] ?? '',
    images: parsed.images,
    colors: parsed.colors,
    sizes: parsed.sizes,
    productType: parsed.productType,
    attributes: parsed.attributes,
    variants: parsed.variants,
    inventory: parsed.inventory,
    prices: parsed.prices,
    storeAvailability: parsed.storeAvailability,
    price: parsed.price ?? primaryPrice?.amount ?? 0,
    originalPrice: parsed.originalPrice ?? primaryPrice?.originalAmount,
    discountPercent: parsed.discountPercent ?? primaryPrice?.discountPercent,
    currency: parsed.currency ?? primaryPrice?.currency ?? 'PEN',
    stock: parsed.stock ?? parsed.inventory?.quantity ?? 0,
    featured: parsed.featured,
    status: parsed.status,
  }
}

function mapProductOptionsResponse(response: AdminProductOptionsResponse): AdminProductOptions {
  const parsed = adminProductOptionsResponseSchema.parse(response)

  if ('categories' in parsed) {
    return parsed
  }

  return parsed.data
}

function mapProductListResponse(response: AdminProductListResponse): AdminProduct[] {
  const parsed = adminProductListResponseSchema.parse(response)

  if (Array.isArray(parsed)) {
    return parsed.map(mapProductDtoToDomain)
  }

  if (Array.isArray(parsed.data)) {
    return parsed.data.map(mapProductDtoToDomain)
  }

  return parsed.data.products.map(mapProductDtoToDomain)
}

function mapSingleProductResponse(response: AdminProductSingleResponse): AdminProduct {
  const parsed = adminProductSingleResponseSchema.parse(response)

  if ('id' in parsed) {
    return mapProductDtoToDomain(parsed)
  }

  if ('id' in parsed.data) {
    return mapProductDtoToDomain(parsed.data)
  }

  return mapProductDtoToDomain(parsed.data.product)
}

export class HttpAdminProductRepository implements AdminProductRepository {
  private readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async list(): Promise<AdminProduct[]> {
    const response = await this.httpClient.get<AdminProductListResponse>('/products')
    return mapProductListResponse(response)
  }

  async getOptions(): Promise<AdminProductOptions> {
    const response = await this.httpClient.get<AdminProductOptionsResponse>('/products/options')
    return mapProductOptionsResponse(response)
  }

  async create(payload: CreateAdminProductInput): Promise<AdminProduct> {
    const response = await this.httpClient.post<AdminProductSingleResponse, CreateAdminProductInput>(
      '/products',
      payload,
    )

    return mapSingleProductResponse(response)
  }

  async update(payload: UpdateAdminProductInput): Promise<AdminProduct> {
    const { id, ...body } = payload

    const response = await this.httpClient.put<AdminProductSingleResponse, CreateAdminProductInput>(
      `/products/${id}`,
      body,
    )

    return mapSingleProductResponse(response)
  }
}
