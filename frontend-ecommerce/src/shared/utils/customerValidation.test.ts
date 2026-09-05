import { describe, expect, it } from 'vitest'
import {
  isValidCustomerName,
  isValidCustomerPhone,
  keepNameLetters,
  keepPhoneDigits,
} from '@shared/utils/customerValidation'

describe('customer validation', () => {
  it('accepts only phone numbers between 6 and 9 digits', () => {
    expect(isValidCustomerPhone('987654321')).toBe(true)
    expect(isValidCustomerPhone('98765')).toBe(false)
    expect(isValidCustomerPhone('9876543210')).toBe(false)
    expect(isValidCustomerPhone('987-654')).toBe(false)
    expect(keepPhoneDigits('98a7-654 3210')).toBe('987654321')
  })

  it('accepts names of up to 50 letters and preserves Spanish characters', () => {
    expect(isValidCustomerName('María José')).toBe(true)
    expect(isValidCustomerName('Ana2')).toBe(false)
    expect(isValidCustomerName('A'.repeat(51))).toBe(false)
    expect(keepNameLetters('María 2-José')).toBe('María José')
  })
})
