import { describe, expect, it } from 'vitest'
import { calculateCenteredProductCrop } from './productImageNormalization'

describe('calculateCenteredProductCrop', () => {
  it('crops landscape images horizontally to 4:5', () => {
    expect(calculateCenteredProductCrop(2000, 1000)).toEqual({
      x: 600,
      y: 0,
      width: 800,
      height: 1000,
    })
  })

  it('crops portrait images vertically to 4:5', () => {
    expect(calculateCenteredProductCrop(800, 1600)).toEqual({
      x: 0,
      y: 300,
      width: 800,
      height: 1000,
    })
  })

  it('keeps images that already use the 4:5 ratio', () => {
    expect(calculateCenteredProductCrop(800, 1000)).toEqual({
      x: 0,
      y: 0,
      width: 800,
      height: 1000,
    })
  })
})