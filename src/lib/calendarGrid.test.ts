import { describe, expect, it } from 'vitest'
import { getMonthGrid } from './calendarGrid'

describe('getMonthGrid', () => {
  it('returns 42 days starting on a Sunday and ending on a Saturday', () => {
    const grid = getMonthGrid(2026, 0) // January 2026
    expect(grid).toHaveLength(42)
    expect(grid[0].getDay()).toBe(0)
    expect(grid[41].getDay()).toBe(6)
  })

  it('rolls over correctly from December to January across a year boundary', () => {
    const grid = getMonthGrid(2026, 0) // January 2026 starts on a Thursday
    expect(grid[0].getFullYear()).toBe(2025)
    expect(grid[0].getMonth()).toBe(11) // December
    expect(grid.some((d) => d.getFullYear() === 2026 && d.getMonth() === 0 && d.getDate() === 1)).toBe(
      true,
    )
  })
})
