import { useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { Box, HStack, Text } from '@chakra-ui/react'
import type { Product } from '@domain/entities/Product'
import { CartContext, type CartItemSelection, type CartStateItem, type CartContextValue } from './cart-context'

function buildCartLineId(productId: string, selection?: CartItemSelection) {
  const color = selection?.color?.trim().toLowerCase() ?? ''
  const size = selection?.size?.trim().toLowerCase() ?? ''
  const itemType = selection?.isGift ? 'gift' : 'standard'
  return `${productId}::${color}::${size}::${itemType}`
}

export function CartProvider({ children }: PropsWithChildren) {
  const [cartItems, setCartItems] = useState<Record<string, CartStateItem>>({})
  const [lastAddedProduct, setLastAddedProduct] = useState<{ name: string; id: number } | null>(null)

  const cartItemsList = useMemo(() => Object.values(cartItems), [cartItems])
  const cartItemCount = useMemo(
    () => cartItemsList.reduce((sum, item) => sum + item.quantity, 0),
    [cartItemsList],
  )
  const cartSubtotal = useMemo(
    () => cartItemsList.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItemsList],
  )

  function addToCart(
    product: Product,
    quantity = 1,
    selection?: CartItemSelection,
  ) {
    setLastAddedProduct({ name: product.name, id: Date.now() })
    setCartItems((prev) => {
      const lineId = buildCartLineId(product.id, selection)
      const current = prev[lineId]

      if (!current) {
        return {
          ...prev,
          [lineId]: {
            lineId,
            product,
            quantity,
            selectedColor: selection?.color,
            selectedSize: selection?.size,
            isGift: selection?.isGift ?? false,
          },
        }
      }

      return {
        ...prev,
        [lineId]: {
          ...current,
          quantity: current.quantity + quantity,
          selectedColor: selection?.color ?? current.selectedColor,
          selectedSize: selection?.size ?? current.selectedSize,
          isGift: selection?.isGift ?? current.isGift,
        },
      }
    })
  }

  function increaseQuantity(lineId: string) {
    setCartItems((prev) => {
      const current = prev[lineId]

      if (!current || (typeof current.product.stock === 'number' && current.quantity >= current.product.stock)) {
        return prev
      }

      return {
        ...prev,
        [lineId]: {
          ...current,
          quantity: current.quantity + 1,
        },
      }
    })
  }

  function removeFromCart(lineId: string) {
    setCartItems((prev) => {
      const current = prev[lineId]

      if (!current) {
        return prev
      }

      if (current.quantity <= 1) {
        const next = { ...prev }
        delete next[lineId]
        return next
      }

      return {
        ...prev,
        [lineId]: {
          ...current,
          quantity: current.quantity - 1,
        },
      }
    })
  }

  function clearCart() {
    setCartItems({})
  }

  function moveOneItem(lineId: string, isGift: boolean) {
    setCartItems((prev) => {
      const current = prev[lineId]

      if (!current || current.isGift === isGift) {
        return prev
      }

      const selection = {
        color: current.selectedColor,
        size: current.selectedSize,
        isGift,
      }
      const targetLineId = buildCartLineId(current.product.id, selection)
      const target = prev[targetLineId]
      const next = { ...prev }

      if (current.quantity === 1) {
        delete next[lineId]
      } else {
        next[lineId] = {
          ...current,
          quantity: current.quantity - 1,
        }
      }

      next[targetLineId] = target
        ? { ...target, quantity: target.quantity + 1 }
        : {
            lineId: targetLineId,
            product: current.product,
            quantity: 1,
            selectedColor: current.selectedColor,
            selectedSize: current.selectedSize,
            isGift,
          }

      return next
    })
  }

  function moveOneItemToGift(lineId: string) {
    moveOneItem(lineId, true)
  }

  function moveOneItemToStandard(lineId: string) {
    moveOneItem(lineId, false)
  }

  useEffect(() => {
    if (!lastAddedProduct) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setLastAddedProduct(null), 2600)
    return () => window.clearTimeout(timeoutId)
  }, [lastAddedProduct])

  const value = useMemo<CartContextValue>(
    () => ({
      cartItems,
      cartItemsList,
      cartItemCount,
      cartSubtotal,
      addToCart,
      increaseQuantity,
      removeFromCart,
      moveOneItemToGift,
      moveOneItemToStandard,
      clearCart,
    }),
    [cartItems, cartItemsList, cartItemCount, cartSubtotal],
  )

  return (
    <CartContext.Provider value={value}>
      {children}
      {lastAddedProduct ? (
        <Box
          role="status"
          position="fixed"
          right={{ base: 4, md: 6 }}
          bottom={{ base: '86px', md: 6 }}
          zIndex={60}
          maxW={{ base: 'calc(100vw - 32px)', md: '360px' }}
          borderRadius="xl"
          bg="#4a1d63"
          color="white"
          px={4}
          py={3}
          boxShadow="0 14px 32px rgba(74, 29, 99, 0.28)"
        >
          <HStack gap={2} align="start">
            <Text aria-hidden="true" color="#f4e8ff" fontWeight="bold">
              +
            </Text>
            <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
              {lastAddedProduct.name} se agrego al carrito.
            </Text>
          </HStack>
        </Box>
      ) : null}
    </CartContext.Provider>
  )
}
