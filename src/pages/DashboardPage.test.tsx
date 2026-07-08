import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from './DashboardPage'
import { addDashboardGraph, deleteDashboardGraph, getDashboardGraphs } from '../lib/dashboardGraphs'
import { toDateString } from '../lib/format'
import { getVisits } from '../lib/visits'
import { makeDashboardGraph, makeVisit as makeBaseVisit } from '../test/factories'
import type { Visit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  getVisits: vi.fn(),
}))

vi.mock('../lib/dashboardGraphs', () => ({
  getDashboardGraphs: vi.fn(),
  addDashboardGraph: vi.fn(),
  deleteDashboardGraph: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(getDashboardGraphs).mockResolvedValue([])
})

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

  it('shows a floating button linking to the add-visit page', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({})])
    renderDashboard()

    await screen.findByText('총 체험단')
    expect(screen.getByRole('link', { name: '체험단 추가' })).toHaveAttribute('href', '/add')
  })

  it('adds a graph via the builder form and renders a GraphCard computed with the selected scope', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', category: '카페', retailValue: 10000, extraPayment: 0 }),
      // Outside the default 이번 달 period, but confirmed: only counted when scope='all'.
      makeVisit({ id: '2', category: '카페', visitDate: '2020-01-01', retailValue: 50000, extraPayment: 0 }),
    ])
    const savedGraph = makeDashboardGraph({ id: 'g1', axis: 'category', chartType: 'bar', scope: 'period' })
    vi.mocked(addDashboardGraph).mockResolvedValue(savedGraph)

    renderDashboard()
    await screen.findByText('총 체험단')

    await userEvent.click(screen.getByRole('button', { name: '+ 그래프 추가' }))
    await userEvent.selectOptions(screen.getByLabelText('기간'), '이번 달')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(addDashboardGraph).toHaveBeenCalledWith({ axis: 'category', chartType: 'bar', scope: 'period' })
    const title = await screen.findByText('카테고리별 평균 절감액')
    const card = within(title.closest('.rounded-xl')!)
    // scope='period' excludes visit '2' (outside 이번 달), so 카페's avg is 10000, not blended with 50000.
    expect(card.getByText('₩10,000')).toBeInTheDocument()
  })

  it('removes a graph card after deleting it', async () => {
    const graph = makeDashboardGraph({ id: 'g1', axis: 'platform', chartType: 'bar', scope: 'all' })
    vi.mocked(getVisits).mockResolvedValue([makeVisit({})])
    vi.mocked(getDashboardGraphs).mockResolvedValue([graph])
    vi.mocked(deleteDashboardGraph).mockResolvedValue(undefined)

    renderDashboard()
    await screen.findByText('플랫폼별 평균 절감액')

    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(deleteDashboardGraph).toHaveBeenCalledWith('g1')
    await waitFor(() => expect(screen.queryByText('플랫폼별 평균 절감액')).not.toBeInTheDocument())
  })

  it('keeps the builder form open and shows an error when adding a graph fails', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({})])
    vi.mocked(addDashboardGraph).mockRejectedValue(new Error('insert failed'))

    renderDashboard()
    await screen.findByText('총 체험단')

    await userEvent.click(screen.getByRole('button', { name: '+ 그래프 추가' }))
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('그래프를 추가하지 못했습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
    expect(screen.queryByText('카테고리별 평균 절감액')).not.toBeInTheDocument()
  })

  it('keeps the graph card and shows an error when deleting a graph fails', async () => {
    const graph = makeDashboardGraph({ id: 'g1', axis: 'platform', chartType: 'bar', scope: 'all' })
    vi.mocked(getVisits).mockResolvedValue([makeVisit({})])
    vi.mocked(getDashboardGraphs).mockResolvedValue([graph])
    vi.mocked(deleteDashboardGraph).mockRejectedValue(new Error('delete failed'))

    renderDashboard()
    await screen.findByText('플랫폼별 평균 절감액')

    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(await screen.findByText('그래프를 삭제하지 못했습니다.')).toBeInTheDocument()
    expect(screen.getByText('플랫폼별 평균 절감액')).toBeInTheDocument()
  })

  it('forces scope to 전체 when axis=월 is chosen, end to end', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({})])
    const savedGraph = makeDashboardGraph({ id: 'g1', axis: 'month', chartType: 'line', scope: 'all' })
    vi.mocked(addDashboardGraph).mockResolvedValue(savedGraph)

    renderDashboard()
    await screen.findByText('총 체험단')

    await userEvent.click(screen.getByRole('button', { name: '+ 그래프 추가' }))
    await userEvent.selectOptions(screen.getByLabelText('축'), '월')
    await userEvent.selectOptions(screen.getByLabelText('차트 종류'), '라인')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(addDashboardGraph).toHaveBeenCalledWith({ axis: 'month', chartType: 'line', scope: 'all' })
    expect(await screen.findByText('월별 평균 절감액')).toBeInTheDocument()
  })
})
