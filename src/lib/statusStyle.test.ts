import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deadlineDisplay, nextStatus, statusBadgeClass, statusDotClass, statusOrder } from './statusStyle'

describe('nextStatus', () => {
  it('cycles 예정 → 방문완료 → 리뷰완료 → 예정', () => {
    expect(nextStatus('예정')).toBe('방문완료')
    expect(nextStatus('방문완료')).toBe('리뷰완료')
    expect(nextStatus('리뷰완료')).toBe('예정')
  })

  it('throws for a status not in statusOrder instead of silently resetting to 예정', () => {
    // simulates a stale DB value from a pre-migration status string (e.g. '완료')
    expect(() => nextStatus('완료' as unknown as (typeof statusOrder)[number])).toThrow()
  })
})

describe('statusBadgeClass / statusDotClass', () => {
  it.each(statusOrder)('returns a distinct class for %s', (status) => {
    expect(statusBadgeClass(status)).toMatch(/^bg-\S+ text-\S+$/)
    expect(statusDotClass(status)).toMatch(/^bg-\S+$/)
  })

  it('uses green for 리뷰완료, amber for 방문완료, blue for 예정', () => {
    expect(statusBadgeClass('리뷰완료')).toContain('green')
    expect(statusBadgeClass('방문완료')).toContain('amber')
    expect(statusBadgeClass('예정')).toContain('blue')
  })
})

describe('deadlineDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 10)) // 2026-01-10
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null when there is no review deadline', () => {
    expect(deadlineDisplay('예정', null)).toBeNull()
  })

  it('returns reviewed:true with a fixed label when status is 리뷰완료, regardless of the date', () => {
    expect(deadlineDisplay('리뷰완료', '2026-01-01')).toEqual({ text: '리뷰완료', reviewed: true })
    expect(deadlineDisplay('리뷰완료', '2099-01-01')).toEqual({ text: '리뷰완료', reviewed: true })
  })

  it('returns reviewed:false with a D-day countdown for 예정 / 방문완료', () => {
    expect(deadlineDisplay('예정', '2026-01-13')).toEqual({ text: 'D-3', reviewed: false })
    expect(deadlineDisplay('방문완료', '2026-01-10')).toEqual({ text: 'D-DAY', reviewed: false })
  })
})
