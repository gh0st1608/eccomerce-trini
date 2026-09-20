import type { AdminOrderRepository } from '@application/ports/AdminOrderRepository'
import type { AdminOrder } from '@domain/entities/AdminOrder'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import {
  adminOrderDtoSchema,
  adminOrderListResponseSchema,
  adminOrderResponseSchema,
  type AdminOrderDto,
  type AdminOrderListResponse,
  type AdminOrderResponse,
} from '@infrastructure/dto/AdminOrderDto'

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

function mapOrderResponse(response: AdminOrderResponse): AdminOrder {
  const parsed = adminOrderResponseSchema.parse(response)
  return mapOrderDtoToDomain('data' in parsed ? parsed.data.order : parsed)
}

export class HttpAdminOrderRepository implements AdminOrderRepository {
  private readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async list(): Promise<AdminOrder[]> {
    const response = await this.httpClient.get<AdminOrderListResponse>('/orders')
    return mapOrderListResponse(response).sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
    )
  }

  async update(
    id: string,
    changes: Partial<Pick<AdminOrder, 'status' | 'paymentStatus'>>,
  ): Promise<AdminOrder> {
    const response = await this.httpClient.put<AdminOrderResponse, typeof changes>(
      `/orders/${encodeURIComponent(id)}`,
      changes,
    )
    return mapOrderResponse(response)
  }

  async delete(id: string): Promise<void> {
    await this.httpClient.delete<void>(`/orders/${encodeURIComponent(id)}`)
  }
}
