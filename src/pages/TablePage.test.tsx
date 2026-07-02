import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import TablePage from './TablePage'
import { getVisits, toggleStatus } from '../lib/visits'
import type { Visit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  getVisits: vi.fn(),
  toggleStatus: vi.fn(),
}))

function makeVisit(overrides: Partial<Visit>): Visit {
  return {
    id: '1',
    visitDate: '2026-01-10',
    platform: '포포몬',
    storeName: '카페 온도',
    category: '카페',
    sponsoredItems: '음료 2',
    campaignUrl: 'https://campaign.example.com',
    storeInfoUrl: 'https://store.example.com',
    retailValue: 10000,
    extraPayment: 0,
    status: '예정',
    postUrl: null,
    reviewDeadline: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function renderTablePage() {
  return render(
    <MemoryRouter initialEntries={['/table']}>
      <Routes>
        <Route path="/table" element={<TablePage />} />
        <Route path="/edit/:id" element={<div>상세 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

// Status/platform values also appear as <option> text in the filter
// selects (and a visit's own status text appears in its badge too), so
// column assertions are scoped to the specific row's cells to avoid
// ambiguous matches.
function getRowCells(storeName: string) {
  const row = screen.getByText(storeName).closest('tr')!
  return within(row).getAllByRole('cell')
}

describe('TablePage loading states', () => {
  it('shows an error message when loading visits fails', async () => {
    vi.mocked(getVisits).mockRejectedValue(new Error('network error'))
    renderTablePage()
    expect(await screen.findByText('목록을 불러오지 못했습니다.')).toBeInTheDocument()
  })

  it('shows an empty state when there are no visits', async () => {
    vi.mocked(getVisits).mockResolvedValue([])
    renderTablePage()
    expect(await screen.findByText('아직 등록된 방문 기록이 없습니다.')).toBeInTheDocument()
  })
})

describe('TablePage columns', () => {
  it('renders each column value, including the computed net savings', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({
        visitDate: '2026-01-10',
        platform: '캐시노트',
        storeName: '카페 온도',
        category: '카페',
        retailValue: 48000,
        extraPayment: 5000,
      }),
    ])
    renderTablePage()

    await screen.findByText('카페 온도')
    const cells = getRowCells('카페 온도')
    expect(cells.map((c) => c.textContent)).toEqual([
      '2026-01-10',
      '-',
      '캐시노트',
      '카페 온도',
      '카페',
      '₩48,000',
      '₩5,000',
      '₩43,000',
      '예정',
    ])
  })

  it('shows the net savings in red when extra payment exceeds retail value (a loss)', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ storeName: '카페 온도', retailValue: 10000, extraPayment: 15000 }),
    ])
    renderTablePage()

    await screen.findByText('카페 온도')
    const netSavedCell = screen.getByText('₩-5,000')
    expect(netSavedCell).toHaveClass('text-red-400')
    expect(netSavedCell).not.toHaveClass('text-green')
  })

  it('shows "-" for no deadline and "리뷰완료" when the review is done', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게A', reviewDeadline: null }),
      makeVisit({ id: '2', storeName: '가게B', reviewDeadline: '2099-01-01', status: '리뷰완료' }),
    ])
    renderTablePage()

    await screen.findByText('가게A')
    expect(getRowCells('가게A')[1]).toHaveTextContent('-')
    expect(getRowCells('가게B')[1]).toHaveTextContent('리뷰완료')
  })
})

describe('TablePage sorting', () => {
  it('sorts by column on header click, toggling direction on a second click', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게A', retailValue: 30000, visitDate: '2026-01-05' }),
      makeVisit({ id: '2', storeName: '가게B', retailValue: 10000, visitDate: '2026-01-15' }),
      makeVisit({ id: '3', storeName: '가게C', retailValue: 20000, visitDate: '2026-01-10' }),
    ])
    renderTablePage()
    await screen.findByText('가게A')

    // default sort: visitDate desc
    expect(screen.getAllByText(/^가게/).map((el) => el.textContent)).toEqual(['가게B', '가게C', '가게A'])

    // click 체험가 -> new column defaults to desc
    await userEvent.click(screen.getByText(/체험가/))
    expect(screen.getAllByText(/^가게/).map((el) => el.textContent)).toEqual(['가게A', '가게C', '가게B'])

    // click 체험가 again -> toggles to asc
    await userEvent.click(screen.getByText(/체험가/))
    expect(screen.getAllByText(/^가게/).map((el) => el.textContent)).toEqual(['가게B', '가게C', '가게A'])
  })

  it('sorts by 순절감액, the computed (retailValue - extraPayment) column', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게A', retailValue: 10000, extraPayment: 0 }), // net 10000
      makeVisit({ id: '2', storeName: '가게B', retailValue: 30000, extraPayment: 25000 }), // net 5000
      makeVisit({ id: '3', storeName: '가게C', retailValue: 20000, extraPayment: 5000 }), // net 15000
    ])
    renderTablePage()
    await screen.findByText('가게A')

    await userEvent.click(screen.getByText(/순절감액/))
    expect(screen.getAllByText(/^가게/).map((el) => el.textContent)).toEqual(['가게C', '가게A', '가게B'])
  })

  it('sorts by 마감일, treating visits without a deadline as coming last (desc)', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게A', reviewDeadline: null }),
      makeVisit({ id: '2', storeName: '가게B', reviewDeadline: '2026-01-05' }),
      makeVisit({ id: '3', storeName: '가게C', reviewDeadline: '2026-01-15' }),
    ])
    renderTablePage()
    await screen.findByText('가게A')

    await userEvent.click(screen.getByText(/마감일/))
    expect(screen.getAllByText(/^가게/).map((el) => el.textContent)).toEqual(['가게C', '가게B', '가게A'])
  })
})

describe('TablePage filters', () => {
  it('filters by status', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게A', status: '예정' }),
      makeVisit({ id: '2', storeName: '가게B', status: '리뷰완료' }),
    ])
    renderTablePage()
    await screen.findByText('가게A')

    await userEvent.selectOptions(screen.getByLabelText('상태 필터'), '리뷰완료')

    expect(screen.queryByText('가게A')).not.toBeInTheDocument()
    expect(screen.getByText('가게B')).toBeInTheDocument()
  })

  it('filters by platform', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게A', platform: '포포몬' }),
      makeVisit({ id: '2', storeName: '가게B', platform: '캐시노트' }),
    ])
    renderTablePage()
    await screen.findByText('가게A')

    await userEvent.selectOptions(screen.getByLabelText('플랫폼 필터'), '캐시노트')

    expect(screen.queryByText('가게A')).not.toBeInTheDocument()
    expect(screen.getByText('가게B')).toBeInTheDocument()
  })

  it('applies status and platform filters together (AND, not OR)', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게A', status: '예정', platform: '포포몬' }),
      makeVisit({ id: '2', storeName: '가게B', status: '예정', platform: '캐시노트' }),
      makeVisit({ id: '3', storeName: '가게C', status: '리뷰완료', platform: '캐시노트' }),
    ])
    renderTablePage()
    await screen.findByText('가게A')

    await userEvent.selectOptions(screen.getByLabelText('상태 필터'), '예정')
    await userEvent.selectOptions(screen.getByLabelText('플랫폼 필터'), '캐시노트')

    // only 가게B matches both 예정 AND 캐시노트
    expect(screen.queryByText('가게A')).not.toBeInTheDocument()
    expect(screen.getByText('가게B')).toBeInTheDocument()
    expect(screen.queryByText('가게C')).not.toBeInTheDocument()
  })

  it('restores the full list when the filter is reset to 전체', async () => {
    vi.mocked(getVisits).mockResolvedValue([
      makeVisit({ id: '1', storeName: '가게A', status: '예정' }),
      makeVisit({ id: '2', storeName: '가게B', status: '리뷰완료' }),
    ])
    renderTablePage()
    await screen.findByText('가게A')

    await userEvent.selectOptions(screen.getByLabelText('상태 필터'), '리뷰완료')
    expect(screen.queryByText('가게A')).not.toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('상태 필터'), '전체')
    expect(screen.getByText('가게A')).toBeInTheDocument()
    expect(screen.getByText('가게B')).toBeInTheDocument()
  })
})

describe('TablePage row actions', () => {
  it('calls toggleStatus when the status badge is clicked (thin wiring check)', async () => {
    const visit = makeVisit({})
    vi.mocked(getVisits).mockResolvedValue([visit])
    vi.mocked(toggleStatus).mockResolvedValue({ ...visit, status: '방문완료' })
    renderTablePage()

    await userEvent.click(await screen.findByRole('button', { name: '예정' }))

    expect(toggleStatus).toHaveBeenCalledWith('1', '예정')
  })

  it('navigates to the detail page when a row is clicked', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({ id: '42', storeName: '카페 온도' })])
    renderTablePage()

    await userEvent.click(await screen.findByText('카페 온도'))

    expect(await screen.findByText('상세 화면')).toBeInTheDocument()
  })

  it('does not navigate when the status badge is clicked', async () => {
    vi.mocked(getVisits).mockResolvedValue([makeVisit({})])
    renderTablePage()

    await userEvent.click(await screen.findByRole('button', { name: '예정' }))
    expect(screen.queryByText('상세 화면')).not.toBeInTheDocument()
  })
})
