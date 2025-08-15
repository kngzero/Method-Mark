import { describe, it, expect } from 'vitest'
import { parseColor } from '../src/utils/color.js'

describe('color parser', () => {
  it('parses hex', () => {
    const res = parseColor('#ff00aa')
    expect(res.ok).toBe(true)
  })
  it('parses rgb', () => {
    const res = parseColor('rgb(10,20,30)')
    expect(res.ok).toBe(true)
  })
  it('parses hsl', () => {
    const res = parseColor('hsl(120, 50%, 50%)')
    expect(res.ok).toBe(true)
  })
  it('parses oklch and converts', () => {
    const res = parseColor('oklch(62% 0.19 244)')
    expect(res.ok).toBe(true)
    // Approx check: blue-ish
    expect(res.hex.slice(0,7).toLowerCase()).toMatch(/^#0[0-1][89a-f]/)
  })
})