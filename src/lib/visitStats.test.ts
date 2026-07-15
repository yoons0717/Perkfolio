import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeTotals,
  confirmedVisits,
  hasRetailValue,
  isInPeriod,
  netColorClass,
  netSaved,
} from './visitStats'
import { makeMoneyVisit, makeVisit } from '../test/factories'

describe('confirmedVisits', () => {
  it('excludes 예정 visits, since they have not actually happened yet', () => {
    const visits = [
      makeVisit({ id: '1', status: '예정' }),
      makeVisit({ id: '3', status: '리뷰완료' }),
    ]
    expect(confirmedVisits(visits).map((v) => v.id)).toEqual(['3'])
  })
})

describe('netSaved', () => {
  it('subtracts extraPayment from retailValue', () => {
    expect(netSaved(makeMoneyVisit({ retailValue: 48000, extraPayment: 5000 }))).toBe(43000)
  })

  it('can be negative when extraPayment exceeds retailValue', () => {
    expect(netSaved(makeMoneyVisit({ retailValue: 10000, extraPayment: 15000 }))).toBe(-5000)
  })
})

describe('netColorClass', () => {
  it('returns text-muted for 예정 visits, regardless of net amount', () => {
    expect(netColorClass(makeMoneyVisit({ status: '예정', retailValue: 50000, extraPayment: 0 }))).toBe('text-muted')
  })

  it('returns text-danger when net savings is negative', () => {
    expect(netColorClass(makeMoneyVisit({ status: '리뷰완료', retailValue: 10000, extraPayment: 20000 }))).toBe(
      'text-danger',
    )
  })

  it('returns text-positive when net savings is zero or positive', () => {
    expect(netColorClass(makeMoneyVisit({ status: '리뷰완료', retailValue: 20000, extraPayment: 10000 }))).toBe(
      'text-positive',
    )
  })
})

describe('hasRetailValue', () => {
  it('returns false for a null retailValue (품목형 방문)', () => {
    expect(hasRetailValue(makeVisit({ retailValue: null }))).toBe(false)
  })

  it('returns true for a numeric retailValue', () => {
    expect(hasRetailValue(makeVisit({ retailValue: 10000 }))).toBe(true)
  })
})

describe('isInPeriod', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 15)) // 2026-06-15
  })
  afterEach(() => vi.useRealTimers())

  it('always matches for "all"', () => {
    expect(isInPeriod('2020-01-01', 'all')).toBe(true)
  })

  it('matches any month within the current year for "thisYear"', () => {
    expect(isInPeriod('2026-01-01', 'thisYear')).toBe(true)
    expect(isInPeriod('2026-12-31', 'thisYear')).toBe(true)
  })

  it('does not match a different year for "thisYear"', () => {
    expect(isInPeriod('2025-06-15', 'thisYear')).toBe(false)
  })

  it('matches only the current year+month for "thisMonth"', () => {
    expect(isInPeriod('2026-06-01', 'thisMonth')).toBe(true)
    expect(isInPeriod('2026-06-30', 'thisMonth')).toBe(true)
  })

  it('does not match the same month in a different year for "thisMonth"', () => {
    expect(isInPeriod('2025-06-15', 'thisMonth')).toBe(false)
  })

  it('does not match a different month in the current year for "thisMonth"', () => {
    expect(isInPeriod('2026-05-15', 'thisMonth')).toBe(false)
  })

  it('matches the previous calendar month for "lastMonth"', () => {
    expect(isInPeriod('2026-05-01', 'lastMonth')).toBe(true)
    expect(isInPeriod('2026-05-31', 'lastMonth')).toBe(true)
  })

  it('does not match the current month for "lastMonth"', () => {
    expect(isInPeriod('2026-06-15', 'lastMonth')).toBe(false)
  })

  it('matches the previous year for "lastYear"', () => {
    expect(isInPeriod('2025-01-01', 'lastYear')).toBe(true)
    expect(isInPeriod('2025-12-31', 'lastYear')).toBe(true)
  })

  it('does not match the current year for "lastYear"', () => {
    expect(isInPeriod('2026-01-01', 'lastYear')).toBe(false)
  })
})

describe('isInPeriod ("lastMonth" across a year boundary)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 15)) // 2026-01-15
  })
  afterEach(() => vi.useRealTimers())

  it('rolls over to December of the previous year when "today" is in January', () => {
    expect(isInPeriod('2025-12-01', 'lastMonth')).toBe(true)
    expect(isInPeriod('2026-01-01', 'lastMonth')).toBe(false)
  })
})

describe('isInPeriod ("custom" date range)', () => {
  const start = new Date(2023, 4, 10) // 2023-05-10
  const end = new Date(2023, 4, 20) // 2023-05-20

  it('matches dates on or between the start and end of the range', () => {
    expect(isInPeriod('2023-05-10', 'custom', [start, end])).toBe(true)
    expect(isInPeriod('2023-05-15', 'custom', [start, end])).toBe(true)
    expect(isInPeriod('2023-05-20', 'custom', [start, end])).toBe(true)
  })

  it('does not match dates before the start or after the end', () => {
    expect(isInPeriod('2023-05-09', 'custom', [start, end])).toBe(false)
    expect(isInPeriod('2023-05-21', 'custom', [start, end])).toBe(false)
  })

  it('matches nothing when no range is provided', () => {
    expect(isInPeriod('2023-05-15', 'custom')).toBe(false)
  })

  it('matches nothing when the range is incomplete (only a start date picked so far)', () => {
    expect(isInPeriod('2023-05-15', 'custom', [start, null])).toBe(false)
  })
})

describe('computeTotals', () => {
  it('sums retail/extra/net and computes the savings rate', () => {
    const visits = [
      makeMoneyVisit({ retailValue: 10000, extraPayment: 0 }),
      makeMoneyVisit({ retailValue: 30000, extraPayment: 10000 }),
    ]
    expect(computeTotals(visits)).toEqual({ count: 2, retail: 40000, extra: 10000, net: 30000, rate: 75 })
  })

  it('returns zeroed totals and a 0% rate for an empty list (avoids divide-by-zero)', () => {
    expect(computeTotals([])).toEqual({ count: 0, retail: 0, extra: 0, net: 0, rate: 0 })
  })
})

describe('computeCategoryBreakdown', () => {
  it('counts visits per category and averages net savings, including zero-count categories', () => {
    const visits = [
      makeVisit({ category: '카페', retailValue: 10000, extraPayment: 0 }),
      makeVisit({ category: '카페', retailValue: 20000, extraPayment: 5000 }), // avg(10000, 15000) = 12500
      makeVisit({ category: '술집', retailValue: 30000, extraPayment: 0 }),
    ]
    const result = computeCategoryBreakdown(visits)
    expect(result).toEqual([
      { category: '카페', count: 2, moneyCount: 2, pct: 100, avgNet: 12500 },
      { category: '음식점', count: 0, moneyCount: 0, pct: 0, avgNet: 0 },
      { category: '술집', count: 1, moneyCount: 1, pct: 50, avgNet: 30000 },
      { category: '기타', count: 0, moneyCount: 0, pct: 0, avgNet: 0 },
    ])
  })

  it('does not divide by zero when there are no visits', () => {
    const result = computeCategoryBreakdown([])
    expect(result.every((r) => r.count === 0 && r.pct === 0 && r.avgNet === 0)).toBe(true)
  })

  it('counts 품목형(null retailValue) visits but excludes them from avgNet, exposing moneyCount separately', () => {
    const visits = [
      makeVisit({ category: '카페', retailValue: 10000, extraPayment: 0 }),
      makeVisit({ category: '카페', retailValue: null, extraPayment: 0 }),
    ]
    const result = computeCategoryBreakdown(visits)
    const cafe = result.find((r) => r.category === '카페')
    // count includes both visits, but moneyCount/avgNet only reflect the money-type one
    expect(cafe).toEqual({ category: '카페', count: 2, moneyCount: 1, pct: 100, avgNet: 10000 })
  })
})

describe('computeMonthlyTrend', () => {
  afterEach(() => vi.useRealTimers())

  it('averages net savings per YYYY-MM, fixed to January through the current month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 15)) // 2026-02-15
    const visits = [
      makeMoneyVisit({ visitDate: '2026-02-01', retailValue: 10000, extraPayment: 0 }),
      makeMoneyVisit({ visitDate: '2026-01-15', retailValue: 20000, extraPayment: 0 }),
      makeMoneyVisit({ visitDate: '2026-01-20', retailValue: 5000, extraPayment: 0 }), // avg(20000, 5000) = 12500
    ]
    expect(computeMonthlyTrend(visits)).toEqual([
      { month: '2026-01', avgNet: 12500 },
      { month: '2026-02', avgNet: 10000 },
    ])
  })

  it('fills months with no visits as 0 instead of omitting them', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 10)) // 2026-03-10
    const visits = [makeMoneyVisit({ visitDate: '2026-01-15', retailValue: 20000, extraPayment: 0 })]
    expect(computeMonthlyTrend(visits)).toEqual([
      { month: '2026-01', avgNet: 20000 },
      { month: '2026-02', avgNet: 0 },
      { month: '2026-03', avgNet: 0 },
    ])
  })

  it('skips visits with no visit date instead of crashing', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 20)) // 2026-01-20
    const visits = [
      makeMoneyVisit({ visitDate: null, retailValue: 10000, extraPayment: 0 }),
      makeMoneyVisit({ visitDate: '2026-01-15', retailValue: 20000, extraPayment: 0 }),
    ]
    expect(computeMonthlyTrend(visits)).toEqual([{ month: '2026-01', avgNet: 20000 }])
  })

  it('ignores visits from a different year', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 20)) // 2026-01-20
    const visits = [makeMoneyVisit({ visitDate: '2025-12-15', retailValue: 20000, extraPayment: 0 })]
    expect(computeMonthlyTrend(visits)).toEqual([{ month: '2026-01', avgNet: 0 }])
  })
})
