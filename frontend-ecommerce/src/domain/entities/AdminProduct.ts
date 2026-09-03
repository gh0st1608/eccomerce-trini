export interface AdminProductAttribute {
  name: string
  values: string[]
}

export interface AdminProductPrice {
  currency: string
  amount: number
  originalAmount?: number
  discountPercent?: number
}

export interface AdminProductInventory {
  quantity: number
  inStock?: boolean
}

export interface AdminProductVariant {
  id?: string
  sku?: string
  name?: string
  imageUrl?: string
  attributes?: Array<{
    name: string
    value: string
  }>
  inventory?: AdminProductInventory
  prices?: AdminProductPrice[]
}

export interface AdminStoreAvailability {
  storeId: string
  available: boolean
  quantity?: number
}

export interface AdminProduct {
  id: string
  name: string
  sku: string
  variantGroup?: string
  description: string
  category: string
  categories?: string[]
  imageUrl: string
  images?: string[]
  colors?: string[]
  sizes?: string[]
  productType?: 'simple' | 'variable'
  attributes?: AdminProductAttribute[]
  variants?: AdminProductVariant[]
  inventory?: AdminProductInventory
  prices?: AdminProductPrice[]
  storeAvailability?: AdminStoreAvailability[]
  price: number
  originalPrice?: number
  discountPercent?: number
  currency: string
  stock: number
  featured: boolean
  status: 'active' | 'inactive'
}

export interface CreateAdminProductInput {
  name: string
  sku: string
  variantGroup?: string
  description: string
  category: string
  categories?: string[]
  imageUrl: string
  images?: string[]
  colors?: string[]
  sizes?: string[]
  productType?: 'simple' | 'variable'
  attributes?: AdminProductAttribute[]
  variants?: AdminProductVariant[]
  inventory?: AdminProductInventory
  prices?: AdminProductPrice[]
  storeAvailability?: AdminStoreAvailability[]
  price: number
  originalPrice?: number
  discountPercent?: number
  currency: string
  stock: number
  featured: boolean
  status: 'active' | 'inactive'
}

export interface UpdateAdminProductInput extends CreateAdminProductInput {
  id: string
}

export interface AdminProductOptions {
  categories: Array<{
    id: string
    name: string
    slug: string
    active: boolean
  }>
  colors: string[]
  sizes: string[]
  productTypes?: string[]
  attributeNames?: string[]
}
