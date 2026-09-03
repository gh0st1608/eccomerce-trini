import type { CheckoutGateway, CheckoutLinks } from '@application/ports/CheckoutGateway'
import type { CheckoutItem } from '@domain/entities/CheckoutItem'
import type { CheckoutDelivery } from '@domain/entities/CheckoutDelivery'
import type { CheckoutCustomer } from '@domain/entities/CheckoutCustomer'

export class GenerateCheckoutUrlUseCase {
  private readonly checkoutGateway: CheckoutGateway

  constructor(checkoutGateway: CheckoutGateway) {
    this.checkoutGateway = checkoutGateway
  }

  async execute(items: CheckoutItem[], delivery: CheckoutDelivery, customer: CheckoutCustomer): Promise<CheckoutLinks> {
    return await this.checkoutGateway.createCheckoutUrl(items, delivery, customer)
  }
}
