import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatWonOrItem } from './format'

describe('formatWonOrItem', () => {
  it('formats a number as won', () => {
    expect(formatWonOrItem(48000)).toBe('₩48,000')
  })

  it('returns 품목 제공 for null (품목형 방문)', () => {
    expect(formatWonOrItem(null)).toBe('품목 제공')
  })
})

describe('formatDate', () => {
  it('formats an ISO date string as a Korean-locale date', () => {
    expect(formatDate('2026-01-03T00:00:00.000Z')).toBe(new Date('2026-01-03T00:00:00.000Z').toLocaleDateString('ko-KR'))
  })
})

describe('formatDateTime', () => {
  it('formats an ISO date string as a Korean-locale date and time', () => {
    expect(formatDateTime('2026-01-03T00:00:00.000Z')).toBe(
      new Date('2026-01-03T00:00:00.000Z').toLocaleString('ko-KR'),
    )
  })
})
