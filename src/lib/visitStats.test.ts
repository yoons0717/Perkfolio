import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computePlatformRanking,
  computeTotals,
  computeUpcomingDeadlines,
  confirmedVisits,
  isInPeriod,
  netSaved,
} from './visitStats'
import { makeVisit } from '../test/factories'
import type { Platform } from '../types/visit'

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
    expect(netSaved(makeVisit({ retailValue: 48000, extraPayment: 5000 }))).toBe(43000)
  })

  it('can be negative when extraPayment exceeds retailValue', () => {
    expect(netSaved(makeVisit({ retailValue: 10000, extraPayment: 15000 }))).toBe(-5000)
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
      makeVisit({ retailValue: 10000, extraPayment: 0 }),
      makeVisit({ retailValue: 30000, extraPayment: 10000 }),
    ]
    expect(computeTotals(visits)).toEqual({ count: 2, retail: 40000, extra: 10000, net: 30000, rate: 75 })
  })

  it('returns zeroed totals and a 0% rate for an empty list (avoids divide-by-zero)', () => {
    expect(computeTotals([])).toEqual({ count: 0, retail: 0, extra: 0, net: 0, rate: 0 })
  })
})

describe('computeUpcomingDeadlines', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 10)) // 2026-01-10
  })
  afterEach(() => vi.useRealTimers())

  it('includes visits with a deadline within the next 3 days', () => {
    const visits = [makeVisit({ id: '1', reviewDeadline: '2026-01-12', status: '예정' })]
    expect(computeUpcomingDeadlines(visits).map((d) => d.visit.id)).toEqual(['1'])
  })

  it('includes overdue deadlines (negative days remaining)', () => {
    const visits = [makeVisit({ id: '1', reviewDeadline: '2026-01-05', status: '예정' })]
    expect(computeUpcomingDeadlines(visits).map((d) => d.visit.id)).toEqual(['1'])
  })

  it('excludes deadlines more than 3 days away', () => {
    const visits = [makeVisit({ id: '1', reviewDeadline: '2026-01-20', status: '예정' })]
    expect(computeUpcomingDeadlines(visits)).toEqual([])
  })

  it('excludes visits with no review deadline', () => {
    const visits = [makeVisit({ id: '1', reviewDeadline: null })]
    expect(computeUpcomingDeadlines(visits)).toEqual([])
  })

  it('excludes visits already marked 리뷰완료, even if the deadline is imminent', () => {
    const visits = [makeVisit({ id: '1', reviewDeadline: '2026-01-11', status: '리뷰완료' })]
    expect(computeUpcomingDeadlines(visits)).toEqual([])
  })

  it('sorts by deadline date ascending (soonest first)', () => {
    const visits = [
      makeVisit({ id: 'later', reviewDeadline: '2026-01-13', status: '예정' }),
      makeVisit({ id: 'sooner', reviewDeadline: '2026-01-11', status: '예정' }),
    ]
    expect(computeUpcomingDeadlines(visits).map((d) => d.visit.id)).toEqual(['sooner', 'later'])
  })
})

describe('computeCategoryBreakdown', () => {
  it('counts visits per category, including zero-count categories', () => {
    const visits = [makeVisit({ category: '카페' }), makeVisit({ category: '카페' }), makeVisit({ category: '술집' })]
    const result = computeCategoryBreakdown(visits)
    expect(result).toEqual([
      { category: '카페', count: 2, pct: 100 },
      { category: '음식점', count: 0, pct: 0 },
      { category: '술집', count: 1, pct: 50 },
      { category: '기타', count: 0, pct: 0 },
    ])
  })

  it('does not divide by zero when there are no visits', () => {
    const result = computeCategoryBreakdown([])
    expect(result.every((r) => r.count === 0 && r.pct === 0)).toBe(true)
  })
})

describe('computePlatformRanking', () => {
  it('averages net savings per visit for each platform and sorts descending', () => {
    const visits = [
      makeVisit({ platform: '포포몬', retailValue: 10000, extraPayment: 0 }), // 10000
      makeVisit({ platform: '캐시노트', retailValue: 30000, extraPayment: 5000 }), // 25000
      makeVisit({ platform: '포포몬', retailValue: 5000, extraPayment: 0 }), // avg(10000, 5000) = 7500
    ]
    expect(computePlatformRanking(visits)).toEqual([
      { platform: '캐시노트', avgNet: 25000, count: 1, pct: 100 },
      { platform: '포포몬', avgNet: 7500, count: 2, pct: 30 },
    ])
  })

  it('is not skewed by visit count (many small visits do not outrank one big one)', () => {
    const visits = [
      makeVisit({ platform: '많이쓴곳' as Platform, retailValue: 1000, extraPayment: 0 }),
      makeVisit({ platform: '많이쓴곳' as Platform, retailValue: 1000, extraPayment: 0 }),
      makeVisit({ platform: '많이쓴곳' as Platform, retailValue: 1000, extraPayment: 0 }),
      makeVisit({ platform: '한번쓴곳' as Platform, retailValue: 10000, extraPayment: 0 }),
    ]
    expect(computePlatformRanking(visits)[0].platform).toBe('한번쓴곳')
  })
})

describe('computeMonthlyTrend', () => {
  afterEach(() => vi.useRealTimers())

  it('sums net savings per YYYY-MM, fixed to January through the current month', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 15)) // 2026-02-15
    const visits = [
      makeVisit({ visitDate: '2026-02-01', retailValue: 10000, extraPayment: 0 }),
      makeVisit({ visitDate: '2026-01-15', retailValue: 20000, extraPayment: 0 }),
      makeVisit({ visitDate: '2026-01-20', retailValue: 5000, extraPayment: 0 }),
    ]
    expect(computeMonthlyTrend(visits)).toEqual([
      { month: '2026-01', net: 25000 },
      { month: '2026-02', net: 10000 },
    ])
  })

  it('fills months with no visits as 0 instead of omitting them', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 2, 10)) // 2026-03-10
    const visits = [makeVisit({ visitDate: '2026-01-15', retailValue: 20000, extraPayment: 0 })]
    expect(computeMonthlyTrend(visits)).toEqual([
      { month: '2026-01', net: 20000 },
      { month: '2026-02', net: 0 },
      { month: '2026-03', net: 0 },
    ])
  })

  it('skips visits with no visit date instead of crashing', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 20)) // 2026-01-20
    const visits = [
      makeVisit({ visitDate: null, retailValue: 10000, extraPayment: 0 }),
      makeVisit({ visitDate: '2026-01-15', retailValue: 20000, extraPayment: 0 }),
    ]
    expect(computeMonthlyTrend(visits)).toEqual([{ month: '2026-01', net: 20000 }])
  })

  it('ignores visits from a different year', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 20)) // 2026-01-20
    const visits = [makeVisit({ visitDate: '2025-12-15', retailValue: 20000, extraPayment: 0 })]
    expect(computeMonthlyTrend(visits)).toEqual([{ month: '2026-01', net: 0 }])
  })
})
