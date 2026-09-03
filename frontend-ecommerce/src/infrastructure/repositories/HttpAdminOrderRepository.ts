import type { AdminOrderRepository } from '@application/ports/AdminOrderRepository'
import type { AdminOrder } from '@domain/entities/AdminOrder'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import {
  adminOrderDtoSchema,
  adminOrderListResponseSchema,
  type AdminOrderDto,
  type AdminOrderListResponse,
} from '@infrastructure/dto/AdminOrderDto'
import {
  applyOrderPaymentStatusOverrides,
  applyOrderStatusOverrides,
  getLocalCheckoutOrders,
} from '@shared/utils/adminOrderHistory'

function mapOrderDtoToDomain(dto: AdminOrderDto): AdminOrder {
  const parsed = adminOrderDtoSchema.parse(dto)

  return {
    id: parsed.id,
    createdAt: parsed.createdAt,
    checkoutUrl: parsed.checkoutUrl,
    sharedCartUrl: parsed.sharedCartUrl,
    shortSharedCartUrl: parsed.shortSharedCartUrl,
    status: parsed.status,
    paymentStatus: parsed.paymentStatus,
    customerPhone: parsed.customerPhone,
    referenceFirstName: parsed.referenceFirstName,
    referenceLastName: parsed.referenceLastName,
    itemCount: parsed.itemCount,
    subtotal: parsed.subtotal,
    source: parsed.source,
    items: parsed.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      isGift: item.isGift,
    })),
  }
}

function mapOrderListResponse(response: AdminOrderListResponse): AdminOrder[] {
  const parsed = adminOrderListResponseSchema.parse(response)

  if (Array.isArray(parsed)) {
    return parsed.map(mapOrderDtoToDomain)
  }

  if (Array.isArray(parsed.data)) {
    return parsed.data.map(mapOrderDtoToDomain)
  }

  return parsed.data.orders.map(mapOrderDtoToDomain)
}

export class HttpAdminOrderRepository implements AdminOrderRepository {
  private readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async list(): Promise<AdminOrder[]> {
    try {
      const response = await this.httpClient.get<AdminOrderListResponse>('/orders/whatsapp')
      const apiOrders = mapOrderListResponse(response).map((order) => ({ ...order, source: 'api' as const }))
      return applyOrderPaymentStatusOverrides(applyOrderStatusOverrides(apiOrders)).sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
      )
    } catch {
      return applyOrderPaymentStatusOverrides(applyOrderStatusOverrides(getLocalCheckoutOrders()))
    }
  }
}
