import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage'
import { toDateString } from '../lib/format'
import { getVisits } from '../lib/visits'
import { makeVisit as makeBaseVisit } from '../test/factories'
import type { Visit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  getVisits: vi.fn(),
}))

// Day 15 is never part of the leading/trailing padding from adjacent
// months, so it's always "이번 달" relative to whenever tests run.
const now = new Date()
function thisMonthDate(day = 15): string {
  return toDateString(new Date(now.getFullYear(), now.getMonth(), day))
}

// Dashboard totals exclude 예정 visits (see confirmedVisits), so tests here
// default to a confirmed status unlike the shared factory's plain 예정.
function makeVisit(overrides: Partial<Visit> = {}): Visit {
  return makeBaseVisit({ visitDate: thisMonthDate(), status: '리뷰완료', ...overrides })
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/edit/:id" element={<div>상세 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

function totalVisitCountText(): string {
  return screen.getByText('총 체험단').nextElementSibling!.textContent!
}

describe('DashboardPage', () => {
  it('shows an error message when loading visits fails', async () => {
    vi.mocked(getVisits).mockRejectedValue(new Error('network error'))
    renderDashboard()
    expect(await screen.findByText('목록을 불러오지 못했습니다.')).toBeInTheDocument()
  })

  it('defaults the period filter to 이번 달', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({})])
    renderDashboard()
    await screen.findByText('총 체험단')
    expect(screen.getByLabelText('기간 필터')).toHaveValue('thisMonth')
  })

  it('shows totals and savings rate computed only from confirmed (non-예정) visits', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', status: '리뷰완료', retailValue: 10000, extraPayment: 0 }),
      makeVisit({ id: '2', status: '리뷰완료', retailValue: 30000, extraPayment: 10000 }),
      makeVisit({ id: '3', status: '예정', retailValue: 999999, extraPayment: 0 }),
    ])
    renderDashboard()

    await screen.findByText('총 체험단')
    expect(totalVisitCountText()).toBe('2건')
    expect(screen.getByText('₩40,000')).toBeInTheDocument()
    expect(screen.getByText('₩10,000')).toBeInTheDocument()
    expect(screen.getByText('₩30,000')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.queryByText('₩1,009,999')).not.toBeInTheDocument()
  })

  it('excludes out-of-period visits by default, then includes them once switched to 전체', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', visitDate: '2020-01-01', status: '리뷰완료' }),
    ])
    renderDashboard()
    await screen.findByText('총 체험단')
    expect(totalVisitCountText()).toBe('0건')

    await userEvent.selectOptions(screen.getByLabelText('기간 필터'), '전체')

    expect(totalVisitCountText()).toBe('1건')
  })

  it('excludes visits with no visit date from the 이번 달 요약 section, even under 전체', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', visitDate: null, status: '리뷰완료', retailValue: 10000, extraPayment: 0 }),
      makeVisit({ id: '2', status: '리뷰완료', retailValue: 5000, extraPayment: 0 }),
    ])
    renderDashboard()
    await screen.findByText('총 체험단')
    expect(totalVisitCountText()).toBe('1건')

    await userEvent.selectOptions(screen.getByLabelText('기간 필터'), '전체')
    expect(totalVisitCountText()).toBe('1건')
  })

  it('reveals an empty date-range picker when "직접 선택" is chosen, showing no results until a range is picked', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ status: '리뷰완료' })])
    renderDashboard()
    await screen.findByText('총 체험단')

    await userEvent.selectOptions(screen.getByLabelText('기간 필터'), '직접 선택')

    expect(screen.getByLabelText('기간 범위 선택')).toHaveValue('')
    expect(totalVisitCountText()).toBe('0건')
  })

  it('shows an upcoming deadline regardless of the selected stats period', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({
        id: '42',
        storeName: '카페 온도',
        visitDate: '2020-01-01', // outside the default 이번 달 period
        reviewDeadline: toDateString(tomorrow),
        status: '예정',
      }),
    ])
    renderDashboard()

    await userEvent.click(await screen.findByText('카페 온도'))

    expect(await screen.findByText('상세 화면')).toBeInTheDocument()
  })

  it('shows an upcoming deadline for a visit with no visit date, since deadlines do not depend on visitDate', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({
        id: '42',
        storeName: '카페 온도',
        visitDate: null,
        reviewDeadline: toDateString(tomorrow),
        status: '예정',
      }),
    ])
    renderDashboard()

    await userEvent.click(await screen.findByText('카페 온도'))
    expect(await screen.findByText('상세 화면')).toBeInTheDocument()
  })

  it('shows a placeholder when there are no upcoming deadlines', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({})])
    renderDashboard()

    expect(await screen.findByText('임박한 마감이 없습니다.')).toBeInTheDocument()
  })

  it('shows a placeholder in the platform ranking when there are no confirmed visits', async () => {
    vi.mocked(getVisits).mockResolvedValue([])
    renderDashboard()

    expect(await screen.findByText('아직 확정된 체험단 기록이 없습니다.')).toBeInTheDocument()
  })
})
