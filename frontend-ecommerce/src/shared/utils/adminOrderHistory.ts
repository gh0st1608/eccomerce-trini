import type { CartStateItem } from '@presentation/providers/cart-context'
import type { AdminOrder } from '@domain/entities/AdminOrder'

const STORAGE_KEY = 'trini-admin-whatsapp-orders'
const STATUS_OVERRIDES_KEY = 'trini-admin-whatsapp-orders-status-overrides'
const PAYMENT_STATUS_OVERRIDES_KEY = 'trini-admin-whatsapp-orders-payment-status-overrides'

type OrderStatus = AdminOrder['status']
type OrderPaymentStatus = AdminOrder['paymentStatus']

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readOrdersFromStorage(): AdminOrder[] {
  if (!isBrowser()) {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as AdminOrder[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((order) => ({
      ...order,
      status: order.status === 'inactive' ? 'inactive' : 'active',
      paymentStatus: order.paymentStatus === 'paid' ? 'paid' : 'pending',
      customerPhone: typeof order.customerPhone === 'string' ? order.customerPhone : '',
      referenceFirstName: typeof order.referenceFirstName === 'string' ? order.referenceFirstName : '',
      referenceLastName: typeof order.referenceLastName === 'string' ? order.referenceLastName : '',
    }))
  } catch {
    return []
  }
}

function saveOrdersInStorage(orders: AdminOrder[]) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
}

function readStatusOverrides(): Record<string, OrderStatus> {
  if (!isBrowser()) {
    return {}
  }

  const raw = window.localStorage.getItem(STATUS_OVERRIDES_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, OrderStatus>
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, status]) => status === 'active' || status === 'inactive'),
    )
  } catch {
    return {}
  }
}

function saveStatusOverrides(overrides: Record<string, OrderStatus>) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STATUS_OVERRIDES_KEY, JSON.stringify(overrides))
}

function readPaymentStatusOverrides(): Record<string, OrderPaymentStatus> {
  if (!isBrowser()) {
    return {}
  }

  const raw = window.localStorage.getItem(PAYMENT_STATUS_OVERRIDES_KEY)
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, OrderPaymentStatus>
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, status]) => status === 'pending' || status === 'paid'),
    )
  } catch {
    return {}
  }
}

function savePaymentStatusOverrides(overrides: Record<string, OrderPaymentStatus>) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(PAYMENT_STATUS_OVERRIDES_KEY, JSON.stringify(overrides))
}

export function registerCheckoutOrder(params: {
  items: CartStateItem[]
  subtotal: number
  checkoutUrl: string
  sharedCartUrl?: string
  shortSharedCartUrl?: string
  customerPhone: string
  referenceFirstName: string
  referenceLastName: string
}) {
  const newOrder: AdminOrder = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    checkoutUrl: params.checkoutUrl,
    sharedCartUrl: params.sharedCartUrl,
    shortSharedCartUrl: params.shortSharedCartUrl,
    status: 'active',
    paymentStatus: 'pending',
    customerPhone: params.customerPhone,
    referenceFirstName: params.referenceFirstName,
    referenceLastName: params.referenceLastName,
    itemCount: params.items.reduce((total, item) => total + item.quantity, 0),
    subtotal: params.subtotal,
    source: 'local-checkout-history',
    items: params.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      imageUrl: item.product.imageUrl,
      quantity: item.quantity,
      unitPrice: item.product.price,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      isGift: item.isGift,
    })),
  }

  const existing = readOrdersFromStorage()
  saveOrdersInStorage([newOrder, ...existing])
}

export function getLocalCheckoutOrders(): AdminOrder[] {
  return readOrdersFromStorage().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export function setLocalCheckoutOrderStatus(orderId: string, status: OrderStatus): boolean {
  const existing = readOrdersFromStorage()
  const next = existing.map((order) =>
    order.id === orderId
      ? {
        ...order,
        status,
      }
      : order,
  )

  const changed = next.some((order, index) => order.status !== existing[index]?.status)
  if (!changed) {
    return false
  }

  saveOrdersInStorage(next)
  return true
}

export function setOrderStatusOverride(orderId: string, status: OrderStatus) {
  const existing = readStatusOverrides()
  saveStatusOverrides({
    ...existing,
    [orderId]: status,
  })
}

export function setLocalCheckoutOrderPaymentStatus(orderId: string, paymentStatus: OrderPaymentStatus): boolean {
  const existing = readOrdersFromStorage()
  const next = existing.map((order) =>
    order.id === orderId
      ? {
        ...order,
        paymentStatus,
      }
      : order,
  )

  const changed = next.some((order, index) => order.paymentStatus !== existing[index]?.paymentStatus)
  if (!changed) {
    return false
  }

  saveOrdersInStorage(next)
  return true
}

export function setOrderPaymentStatusOverride(orderId: string, paymentStatus: OrderPaymentStatus) {
  const existing = readPaymentStatusOverrides()
  savePaymentStatusOverrides({
    ...existing,
    [orderId]: paymentStatus,
  })
}

export function applyOrderStatusOverrides(orders: AdminOrder[]): AdminOrder[] {
  const overrides = readStatusOverrides()

  return orders.map((order) => ({
    ...order,
    status: overrides[order.id] ?? (order.status === 'inactive' ? 'inactive' : 'active'),
  }))
}

export function applyOrderPaymentStatusOverrides(orders: AdminOrder[]): AdminOrder[] {
  const overrides = readPaymentStatusOverrides()

  return orders.map((order) => ({
    ...order,
    paymentStatus: overrides[order.id] ?? (order.paymentStatus === 'paid' ? 'paid' : 'pending'),
  }))
}
