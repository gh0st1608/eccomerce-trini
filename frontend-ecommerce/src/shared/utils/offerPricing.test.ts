import { describe, expect, it } from 'vitest'
import {
  updateOfferFromDiscount,
  updateOfferFromOriginalPrice,
  updateOfferFromPrice,
} from '@shared/utils/offerPricing'

describe('offer pricing', () => {
  it('calculates the discount after both prices are entered', () => {
    expect(updateOfferFromOriginalPrice({ price: 150 }, 200)).toEqual({
      price: 150,
      originalPrice: 200,
      discountPercent: 25,
    })
    expect(updateOfferFromPrice({ price: 0, originalPrice: 200 }, 150)).toEqual({
      price: 150,
      originalPrice: 200,
      discountPercent: 25,
    })
  })

  it('calculates the missing price from the discount', () => {
    expect(updateOfferFromDiscount({ price: 0, originalPrice: 200 }, 25)).toEqual({
      price: 150,
      originalPrice: 200,
      discountPercent: 25,
    })
    expect(updateOfferFromDiscount({ price: 150 }, 25)).toEqual({
      price: 150,
      originalPrice: 200,
      discountPercent: 25,
    })
  })

  it('uses the original price as the base when the discount changes', () => {
    expect(updateOfferFromDiscount({ price: 150, originalPrice: 200 }, 10)).toEqual({
      price: 180,
      originalPrice: 200,
      discountPercent: 10,
    })
  })
})