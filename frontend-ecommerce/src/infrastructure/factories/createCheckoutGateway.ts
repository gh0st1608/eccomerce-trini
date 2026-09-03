import type { CheckoutGateway } from '@application/ports/CheckoutGateway'
import { FetchHttpClient } from '@infrastructure/clients/FetchHttpClient'
import { env } from '@infrastructure/config/env'
import { HttpCheckoutGateway } from '@infrastructure/gateways/HttpCheckoutGateway'

export function createCheckoutGateway(): CheckoutGateway {
  const httpClient = new FetchHttpClient({
    baseUrl: env.VITE_ECOMMERCE_API_BASE_URL,
  })

  return new HttpCheckoutGateway(httpClient)
}
