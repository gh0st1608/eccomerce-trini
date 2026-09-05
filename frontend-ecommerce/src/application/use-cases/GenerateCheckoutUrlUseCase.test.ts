import { describe, expect, it } from 'vitest'
import type { CheckoutGateway } from '@application/ports/CheckoutGateway'
import { GenerateCheckoutUrlUseCase } from '@application/use-cases/GenerateCheckoutUrlUseCase'

const checkoutGatewayStub: CheckoutGateway = {
  createCheckoutUrl: async () => ({
    checkoutUrl: 'https://wa.me/51999999999?text=hola',
    sharedCartUrl: 'https://app.example.com/cart/shared?token=test-token',
  }),
  resolveSharedCheckout: async () => ({
    checkout: {
      itemCount: 0,
      subtotal: 0,
      items: [],
    },
    delivery: {
      method: 'courier',
    },
  }),
}

describe('GenerateCheckoutUrlUseCase', () => {
  it('returns checkout url from gateway', async () => {
    const useCase = new GenerateCheckoutUrlUseCase(checkoutGatewayStub)

    const checkoutLinks = await useCase.execute(
      [
        {
          productId: 'TR-001',
          quantity: 1,
        },
      ],
      { method: 'courier' },
      {
        phone: '999999999',
        firstName: 'Ana',
        paternalLastName: 'Perez',
        maternalLastName: 'Gomez',
      },
    )

    expect(checkoutLinks.checkoutUrl).toContain('wa.me')
    expect(checkoutLinks.sharedCartUrl).toContain('/cart/shared?token=')
  })
})
