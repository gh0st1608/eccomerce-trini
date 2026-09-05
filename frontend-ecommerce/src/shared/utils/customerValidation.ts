const PHONE_PATTERN = /^\d{6,9}$/
const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?: [A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/

export const CUSTOMER_PHONE_MAX_LENGTH = 9
export const CUSTOMER_NAME_MAX_LENGTH = 50

export function isValidCustomerPhone(value: string): boolean {
  return PHONE_PATTERN.test(value.trim())
}

export function isValidCustomerName(value: string): boolean {
  const normalizedValue = value.trim()
  return (
    normalizedValue.length >= 2 &&
    normalizedValue.length <= CUSTOMER_NAME_MAX_LENGTH &&
    NAME_PATTERN.test(normalizedValue)
  )
}

export function keepPhoneDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, CUSTOMER_PHONE_MAX_LENGTH)
}

export function keepNameLetters(value: string): string {
  return value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, '').slice(0, CUSTOMER_NAME_MAX_LENGTH)
}
