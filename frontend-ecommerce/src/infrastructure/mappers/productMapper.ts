import type { Product } from '@domain/entities/Product'
import {
  productDtoSchema,
  productDetailResponseSchema,
  productsApiResponseSchema,
  type ProductDto,
  type ProductDetailResponse,
  type ProductsApiResponse,
} from '@infrastructure/dto/ProductDto'

export function mapProductDtoToDomain(productDto: ProductDto): Product {
  const dto = productDtoSchema.parse(productDto)
  const primaryPrice = dto.prices?.[0]
  const derivedPrice = dto.price ?? primaryPrice?.amount ?? 0
  const derivedOriginalPrice = dto.originalPrice ?? primaryPrice?.originalAmount
  const derivedDiscountPercent = dto.discountPercent ?? primaryPrice?.discountPercent
  const derivedStock = dto.stock ?? dto.inventory?.quantity
  const derivedCategory = dto.category ?? dto.categories?.[0] ?? 'general'
  const derivedImageUrl = dto.imageUrl ?? dto.images?.[0] ?? ''

  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    category: derivedCategory,
    categories: dto.categories,
    imageUrl: derivedImageUrl,
    images: dto.images,
    colors: dto.colors,
    sizes: dto.sizes,
    productType: dto.productType,
    attributes: dto.attributes,
    variants: dto.variants,
    inventory: dto.inventory,
    prices: dto.prices,
    storeAvailability: dto.storeAvailability,
    price: derivedPrice,
    originalPrice: derivedOriginalPrice,
    discountPercent: derivedDiscountPercent,
    featured: dto.featured,
    currency: dto.currency ?? primaryPrice?.currency,
    stock: derivedStock,
    sku: dto.sku,
  }
}

export function mapProductsApiResponseToDomain(response: ProductsApiResponse): Product[] {
  const parsed = productsApiResponseSchema.parse(response)

  if (Array.isArray(parsed)) {
    return parsed.map(mapProductDtoToDomain)
  }

  if (Array.isArray(parsed.data)) {
    return parsed.data.map(mapProductDtoToDomain)
  }

  return parsed.data.products.map(mapProductDtoToDomain)
}

export function mapProductDetailResponseToDomain(response: ProductDetailResponse): Product {
  const parsed = productDetailResponseSchema.parse(response)

  if ('id' in parsed) {
    return mapProductDtoToDomain(parsed)
  }

  if ('id' in parsed.data) {
    return mapProductDtoToDomain(parsed.data)
  }

  return mapProductDtoToDomain(parsed.data.product)
}
