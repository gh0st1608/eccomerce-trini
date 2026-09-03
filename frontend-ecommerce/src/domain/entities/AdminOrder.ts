export interface AdminOrderItem {
  productId: string
  productName: string
  imageUrl?: string
  quantity: number
  unitPrice: number
  selectedColor?: string
  selectedSize?: string
  isGift?: boolean
}

export interface AdminOrder {
  id: string
  createdAt: string
  checkoutUrl: string
  sharedCartUrl?: string
  shortSharedCartUrl?: string
  status: 'active' | 'inactive'
  paymentStatus: 'pending' | 'paid'
  customerPhone: string
  referenceFirstName: string
  referenceLastName: string
  itemCount: number
  subtotal: number
  source: 'api' | 'local-checkout-history'
  items: AdminOrderItem[]
}
