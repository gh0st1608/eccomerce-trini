import { describe, expect, it } from 'vitest'
import { normalizeSlug } from './slug'

describe('normalizeSlug', () => {
  it('preserves ñ while normalizing the remaining slug characters', () => {
    expect(normalizeSlug('Niñez y Niños')).toBe('niñez-y-niños')
    expect(normalizeSlug('Nin\u0303ez')).toBe('niñez')
  })

  it('continues removing accents and unsupported characters', () => {
    expect(normalizeSlug('Categoría Útil!')).toBe('categoria-util')
  })
})