import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime } from './format'

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
