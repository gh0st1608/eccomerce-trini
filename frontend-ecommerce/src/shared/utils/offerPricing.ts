export interface OfferPricing {
  price: number
  originalPrice?: number
  discountPercent?: number
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function isPositive(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function isValidDiscount(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 90
}

export function updateOfferFromPrice(
  current: OfferPricing,
  price: number,
): OfferPricing {
  if (!isPositive(price) || !isPositive(current.originalPrice) || price >= current.originalPrice) {
    return { ...current, price, discountPercent: undefined }
  }

  return {
    ...current,
    price,
    discountPercent: Math.round(((current.originalPrice - price) / current.originalPrice) * 100),
  }
}

export function updateOfferFromOriginalPrice(
  current: OfferPricing,
  originalPrice: number | undefined,
): OfferPricing {
  if (!isPositive(originalPrice)) {
    return { ...current, originalPrice, discountPercent: undefined }
  }

  if (isPositive(current.price) && current.price < originalPrice) {
    return {
      ...current,
      originalPrice,
      discountPercent: Math.round(((originalPrice - current.price) / originalPrice) * 100),
    }
  }

  if (isValidDiscount(current.discountPercent)) {
    return {
      ...current,
      originalPrice,
      price: roundMoney(originalPrice * (1 - current.discountPercent / 100)),
    }
  }

  return { ...current, originalPrice }
}

export function updateOfferFromDiscount(
  current: OfferPricing,
  discountPercent: number | undefined,
): OfferPricing {
  if (!isValidDiscount(discountPercent)) {
    return { ...current, discountPercent }
  }

  if (isPositive(current.originalPrice)) {
    return {
      ...current,
      discountPercent,
      price: roundMoney(current.originalPrice * (1 - discountPercent / 100)),
    }
  }

  if (isPositive(current.price)) {
    return {
      ...current,
      discountPercent,
      originalPrice: roundMoney(current.price / (1 - discountPercent / 100)),
    }
  }

  return { ...current, discountPercent }
}