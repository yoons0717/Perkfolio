import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CalendarPage, { getMonthGrid } from './CalendarPage'
import { formatDDay } from '../lib/format'
import { getVisits } from '../lib/visits'
import { makeVisit as makeBaseVisit } from '../test/factories'
import type { Visit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  getVisits: vi.fn(),
}))

// Days 15/16 are never part of the leading/trailing padding cells from
// adjacent months (padding never reaches past day ~14), so picking them
// relative to the real current month avoids Date mocking entirely while
// guaranteeing the visit renders in the initially-displayed grid.
const now = new Date()
function thisMonthDate(day: number): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
const DAY_15 = thisMonthDate(15)
const DAY_16 = thisMonthDate(16)

function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return makeBaseVisit({ visitDate: DAY_15, ...overrides })
}

function renderCalendar() {
  return render(
    <MemoryRouter initialEntries={['/calendar']}>
      <Routes>
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/edit/:id" element={<div>상세 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('CalendarPage', () => {
  it('shows an error message when loading visits fails', async () => {
    vi.mocked(getVisits).mockRejectedValue(new Error('network error'))
    renderCalendar()
    expect(await screen.findByText('목록을 불러오지 못했습니다.')).toBeInTheDocument()
  })

  it('shows a visit on its visit date cell', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15 })])
    renderCalendar()
    expect(await screen.findByText('카페 온도')).toBeInTheDocument()
  })

  it('labels a visit-date cell "방문", distinguishing it from a deadline cell', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15 })])
    renderCalendar()
    expect(await screen.findByText('방문')).toBeInTheDocument()
  })

  it('shows a review deadline on a different cell than the visit date', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15, reviewDeadline: DAY_16 })])
    renderCalendar()

    // store name renders once on the visit-date cell and once on the
    // deadline cell (separate <span>s, each also holding its own label)
    expect(await screen.findAllByText('카페 온도')).toHaveLength(2)
    // deadline cell: store name + "마감 D-n" label, in a separate card
    expect(await screen.findByText(/마감/)).toBeInTheDocument()
  })

  it.each([
    ['예정', 'bg-red-500', '리뷰 마감'],
    ['리뷰완료', 'bg-muted', '리뷰 완료'],
  ] as const)(
    'shows a status dot on the panel deadline row matching its reviewed state (%s)',
    async (status, colorClass, label) => {
      vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15, reviewDeadline: DAY_16, status })])
      renderCalendar()

      await userEvent.click(await screen.findByText('16'))
      const panelHeader = await screen.findByText(DAY_16)
      const panel = within(panelHeader.parentElement!)
      const deadlineLabel = panel.getByText(label, { selector: 'p' })
      const dot = deadlineLabel.parentElement!.previousElementSibling as HTMLElement
      expect(dot.className).toContain(colorClass)
    },
  )

  it('shows the exact D-day count for a review deadline', async () => {
    // Computed from the same formatDDay the app uses, against the real
    // current date — no system-time mocking needed, and this still
    // catches wiring bugs (e.g. passing the wrong date into the display).
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15, reviewDeadline: DAY_16 })])
    renderCalendar()

    const expectedDDay = formatDDay(DAY_16)
    expect(await screen.findByText(`마감 ${expectedDDay}`)).toBeInTheDocument()
  })

  it('labels a reviewed deadline cell "리뷰 완료", so it reads as a deadline card rather than another visit card', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ visitDate: DAY_15, reviewDeadline: DAY_16, status: '리뷰완료' }),
    ])
    renderCalendar()

    expect(await screen.findByText('리뷰 완료')).toBeInTheDocument()
  })

  it.each([
    ['예정', 'bg-blue'],
    ['방문완료', 'bg-amber'],
    ['리뷰완료', 'bg-green'],
  ] as const)('shows %s visits with their matching dot color and panel badge', async (status, colorClass) => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15, status })])
    renderCalendar()

    const storeNameEl = await screen.findByText('카페 온도')
    const dot = storeNameEl.parentElement!.previousElementSibling as HTMLElement
    expect(dot.className).toContain(colorClass)

    await userEvent.click(screen.getByText('15'))
    expect(await screen.findByText(status)).toBeInTheDocument()
  })

  it('shows each visit platform and category in the day panel', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15, platform: '캐시노트', category: '카페' })])
    renderCalendar()

    await userEvent.click(await screen.findByText('15'))
    expect(await screen.findByText('캐시노트 · 카페')).toBeInTheDocument()
  })

  it('shows "+N개" when more than 2 visits fall on the same day', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게1', visitDate: DAY_15 }),
      makeVisit({ id: '2', storeName: '가게2', visitDate: DAY_15 }),
      makeVisit({ id: '3', storeName: '가게3', visitDate: DAY_15 }),
    ])
    renderCalendar()

    expect(await screen.findByText('가게1')).toBeInTheDocument()
    expect(screen.getByText('가게2')).toBeInTheDocument()
    expect(screen.queryByText('가게3')).not.toBeInTheDocument()
    expect(screen.getByText('+1개')).toBeInTheDocument()
  })

  it('shows the day panel with its visits, and an empty message for days with none', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15 })])
    renderCalendar()

    await userEvent.click(await screen.findByText('15'))
    const panelHeader = await screen.findByText(DAY_15)
    const panel = within(panelHeader.parentElement!)
    expect(panel.getByText(/카페 온도/)).toBeInTheDocument()

    await userEvent.click(screen.getByText('16'))
    expect(await screen.findByText('이 날짜에 등록된 방문이 없습니다.')).toBeInTheDocument()
  })

  it('navigates to the detail page when a panel row is clicked', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ id: '42', visitDate: DAY_15 })])
    renderCalendar()

    await userEvent.click(await screen.findByText('15'))
    const panelHeader = await screen.findByText(DAY_15)
    const panel = within(panelHeader.parentElement!)
    await userEvent.click(panel.getByText(/카페 온도/))

    expect(await screen.findByText('상세 화면')).toBeInTheDocument()
  })
})

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
