export interface ProductAttribute {
  name: string
  values: string[]
}

export interface ProductPrice {
  currency: string
  amount: number
  originalAmount?: number
  discountPercent?: number
}

export interface ProductInventory {
  quantity: number
  inStock?: boolean
}

export interface ProductVariant {
  id?: string
  sku?: string
  name?: string
  imageUrl?: string
  attributes?: Array<{
    name: string
    value: string
  }>
  inventory?: ProductInventory
  prices?: ProductPrice[]
}

export interface StoreAvailability {
  storeId: string
  available: boolean
  quantity?: number
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  categories?: string[]
  imageUrl: string
  images?: string[]
  colors?: string[]
  sizes?: string[]
  productType?: 'simple' | 'variable'
  attributes?: ProductAttribute[]
  variants?: ProductVariant[]
  inventory?: ProductInventory
  prices?: ProductPrice[]
  storeAvailability?: StoreAvailability[]
  price: number
  originalPrice?: number
  discountPercent?: number
  featured: boolean
  currency?: string
  stock?: number
  sku?: string
}
