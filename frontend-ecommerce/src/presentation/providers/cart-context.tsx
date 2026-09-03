import { createContext, useContext } from 'react'
import type { Product } from '@domain/entities/Product'

export interface CartStateItem {
  lineId: string
  product: Product
  quantity: number
  selectedColor?: string
  selectedSize?: string
  isGift: boolean
}

export interface CartItemSelection {
  color?: string
  size?: string
  isGift?: boolean
}

export interface CartContextValue {
  cartItems: Record<string, CartStateItem>
  cartItemsList: CartStateItem[]
  cartItemCount: number
  cartSubtotal: number
  addToCart: (product: Product, quantity?: number, selection?: CartItemSelection) => void
  increaseQuantity: (lineId: string) => void
  removeFromCart: (lineId: string) => void
  moveOneItemToGift: (lineId: string) => void
  moveOneItemToStandard: (lineId: string) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }

  return context
}
