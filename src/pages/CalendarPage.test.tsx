import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CalendarPage from './CalendarPage'
import { formatDDay, toDateString } from '../lib/format'
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
  return toDateString(new Date(now.getFullYear(), now.getMonth(), day))
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

  it('labels a visit-date cell with its actual status, not a generic "방문" that would contradict the status color', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15, status: '리뷰완료' })])
    renderCalendar()
    expect(await screen.findByText('리뷰완료')).toBeInTheDocument()
    expect(screen.queryByText('방문')).not.toBeInTheDocument()
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

  it('shows a red status dot on the panel deadline row for an unreviewed deadline', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ visitDate: DAY_15, reviewDeadline: DAY_16, status: '예정' }),
    ])
    renderCalendar()

    await userEvent.click(await screen.findByText('16'))
    const panelHeader = await screen.findByText(DAY_16)
    const panel = within(panelHeader.parentElement!)
    const deadlineLabel = panel.getByText('리뷰 마감', { selector: 'p' })
    const dot = deadlineLabel.parentElement!.previousElementSibling as HTMLElement
    expect(dot.className).toContain('bg-danger')
  })

  it('shows the exact D-day count for a review deadline', async () => {
    // Computed from the same formatDDay the app uses, against the real
    // current date — no system-time mocking needed, and this still
    // catches wiring bugs (e.g. passing the wrong date into the display).
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15, reviewDeadline: DAY_16 })])
    renderCalendar()

    const expectedDDay = formatDDay(DAY_16)
    expect(await screen.findByText(`마감 ${expectedDDay}`)).toBeInTheDocument()
  })

  it('moves a reviewed visit from its visit-date cell to its deadline-date cell, so it is not shown twice', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ visitDate: DAY_15, reviewDeadline: DAY_16, status: '리뷰완료' }),
    ])
    renderCalendar()

    // only the deadline cell renders a card for this visit
    expect(await screen.findAllByText('카페 온도')).toHaveLength(1)
    expect(await screen.findByText('리뷰 완료')).toBeInTheDocument()

    await userEvent.click(screen.getByText('15'))
    expect(await screen.findByText('이 날짜에 등록된 체험단이 없습니다.')).toBeInTheDocument()
  })

  it('shows a pending visit only once when its visit date and review deadline are the same day', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ visitDate: DAY_15, reviewDeadline: DAY_15, status: '예정' }),
    ])
    renderCalendar()

    expect(await screen.findAllByText('카페 온도')).toHaveLength(1)
  })

  it('excludes a visit with no visit date from the day grid, but still shows its deadline card', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeBaseVisit({ visitDate: null, reviewDeadline: DAY_16, storeName: '카페 온도', status: '예정' }),
    ])
    renderCalendar()

    // only the deadline card renders — no visit-date cell exists to duplicate onto
    expect(await screen.findAllByText('카페 온도')).toHaveLength(1)
    expect(screen.getByText(/마감/)).toBeInTheDocument()
  })

  it('keeps a reviewed visit on its visit-date cell when it has no review deadline set', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ visitDate: DAY_15, reviewDeadline: null, status: '리뷰완료' }),
    ])
    renderCalendar()

    expect(await screen.findByText('카페 온도')).toBeInTheDocument()
    expect(await screen.findByText('리뷰완료')).toBeInTheDocument()
  })

  it.each([
    ['예정', 'bg-muted'],
    ['리뷰완료', 'bg-violet'],
  ] as const)('shows %s visits with their matching dot color and panel badge', async (status, colorClass) => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15, status })])
    renderCalendar()

    const storeNameEl = await screen.findByText('카페 온도')
    const dot = storeNameEl.parentElement!.previousElementSibling as HTMLElement
    expect(dot.className).toContain(colorClass)

    await userEvent.click(screen.getByText('15'))
    const panelHeader = await screen.findByText(DAY_15)
    const panel = within(panelHeader.parentElement!)
    expect(panel.getByText(status)).toBeInTheDocument()
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

  it('shows a neutral "+N개" (not "+N개 마감") when more than 2 deadlines fall on the same day, since a hidden one may already be reviewed', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게1', reviewDeadline: DAY_16, status: '리뷰완료' }),
      makeVisit({ id: '2', storeName: '가게2', reviewDeadline: DAY_16, status: '리뷰완료' }),
      makeVisit({ id: '3', storeName: '가게3', reviewDeadline: DAY_16, status: '리뷰완료' }),
    ])
    renderCalendar()

    expect(await screen.findByText('가게1')).toBeInTheDocument()
    expect(screen.getByText('가게2')).toBeInTheDocument()
    expect(screen.queryByText('가게3')).not.toBeInTheDocument()
    expect(screen.getByText('+1개')).toBeInTheDocument()
    expect(screen.queryByText(/마감$/)).not.toBeInTheDocument()
  })

  it('shows the day panel with its visits, and an empty message for days with none', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ visitDate: DAY_15 })])
    renderCalendar()

    await userEvent.click(await screen.findByText('15'))
    const panelHeader = await screen.findByText(DAY_15)
    const panel = within(panelHeader.parentElement!)
    expect(panel.getByText(/카페 온도/)).toBeInTheDocument()

    await userEvent.click(screen.getByText('16'))
    expect(await screen.findByText('이 날짜에 등록된 체험단이 없습니다.')).toBeInTheDocument()
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
