import type { CheckoutGateway, CheckoutLinks, SharedCheckoutPayload } from '@application/ports/CheckoutGateway'
import type { CheckoutItem } from '@domain/entities/CheckoutItem'
import type { CheckoutDelivery } from '@domain/entities/CheckoutDelivery'
import type { CheckoutCustomer } from '@domain/entities/CheckoutCustomer'
import type { HttpClient } from '@infrastructure/clients/HttpClient'
import {
  checkoutRequestSchema,
  checkoutResponseSchema,
  sharedCheckoutResponseSchema,
  type CheckoutRequestDto,
  type CheckoutResponseDto,
  type SharedCheckoutResponseDto,
} from '@infrastructure/dto/CheckoutDto'

export class HttpCheckoutGateway implements CheckoutGateway {
  private readonly httpClient: HttpClient

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient
  }

  async createCheckoutUrl(items: CheckoutItem[], delivery: CheckoutDelivery, customer: CheckoutCustomer): Promise<CheckoutLinks> {
    const payload: CheckoutRequestDto = checkoutRequestSchema.parse({ items, delivery, customer })
    const response = await this.httpClient.post<CheckoutResponseDto, CheckoutRequestDto>(
      '/whatsapp',
      payload,
    )

    const parsed = checkoutResponseSchema.parse(response)

    if ('checkoutUrl' in parsed) {
      return {
        checkoutUrl: parsed.checkoutUrl,
        sharedCartUrl: parsed.sharedCartUrl,
        shortSharedCartUrl: parsed.shortSharedCartUrl,
      }
    }

    return {
      checkoutUrl: parsed.data.checkoutUrl,
      sharedCartUrl: parsed.data.sharedCartUrl,
      shortSharedCartUrl: parsed.data.shortSharedCartUrl,
    }
  }

  async resolveSharedCheckout(token: string): Promise<SharedCheckoutPayload> {
    const encodedToken = encodeURIComponent(token)
    const response = await this.httpClient.get<SharedCheckoutResponseDto>(`/shared?token=${encodedToken}`)
    const parsed = sharedCheckoutResponseSchema.parse(response)

    if ('sharedCheckout' in parsed) {
      return parsed.sharedCheckout
    }

    return parsed.data.sharedCheckout
  }
}
