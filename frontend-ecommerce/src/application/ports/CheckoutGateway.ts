import type { CheckoutItem } from '@domain/entities/CheckoutItem'
import type { CheckoutDelivery } from '@domain/entities/CheckoutDelivery'
import type { CheckoutCustomer } from '@domain/entities/CheckoutCustomer'

export interface CheckoutLinks {
  checkoutUrl: string
  sharedCartUrl?: string | null
  shortSharedCartUrl?: string | null
}

export interface SharedCheckoutItem {
  productId: string
  productName: string
  imageUrl?: string
  category?: string
  quantity: number
  unitPrice: number
  originalPrice?: number
  discountPercent?: number
  total: number
  color?: string
  size?: string
  isGift?: boolean
}

export interface SharedCheckoutPayload {
  checkout: {
    itemCount: number
    subtotal: number
    items: SharedCheckoutItem[]
  }
  delivery: {
    method: 'pickup' | 'courier'
    storeId?: string
    storeName?: string
    storeAddress?: string
    storeDistrict?: string
  }
}

export interface CheckoutGateway {
  createCheckoutUrl(items: CheckoutItem[], delivery: CheckoutDelivery, customer: CheckoutCustomer): Promise<CheckoutLinks>
  resolveSharedCheckout(token: string): Promise<SharedCheckoutPayload>
}
