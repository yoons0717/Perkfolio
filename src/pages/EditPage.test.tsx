import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EditPage from './EditPage'
import { deleteVisit, getVisit, updateVisit } from '../lib/visits'
import type { Visit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  getVisit: vi.fn(),
  updateVisit: vi.fn(),
  deleteVisit: vi.fn(),
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

function renderEditPage(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/edit/${id}`]}>
      <Routes>
        <Route path="/edit/:id" element={<EditPage />} />
        <Route path="/table" element={<div>표 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('EditPage loading', () => {
  it('shows an error message when the visit fails to load', async () => {
    vi.mocked(getVisit).mockRejectedValue(new Error('not found'))
    renderEditPage()
    expect(await screen.findByText('기록을 불러오지 못했습니다.')).toBeInTheDocument()
  })
})

describe('EditPage view mode', () => {
  it('renders the visit fields', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({}))
    renderEditPage()

    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('2026-01-10')).toBeInTheDocument()
    expect(screen.getByText('포포몬')).toBeInTheDocument()
    expect(screen.getByText('카페')).toBeInTheDocument()
    expect(screen.getByText('음료 2')).toBeInTheDocument()
    expect(screen.getByText('₩10,000')).toBeInTheDocument()
    expect(screen.getByText('예정')).toBeInTheDocument()
  })

  it('shows "바로가기" for filled links and "없음" for an empty one', async () => {
    // fix reviewDeadline to a real date so its own "없음" doesn't collide
    // with postUrl's "없음" in this assertion
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ postUrl: null, reviewDeadline: '2099-01-01' }))
    renderEditPage()

    await screen.findByRole('heading', { name: '카페 온도' })
    // storeInfoUrl and campaignUrl are filled -> 2 "바로가기" links
    expect(screen.getAllByText('바로가기')).toHaveLength(2)
    // postUrl is null -> "없음"
    expect(screen.getByText('없음')).toBeInTheDocument()
  })

  it('shows "없음" when there is no review deadline', async () => {
    // fix postUrl to a real link so its own "바로가기" doesn't add a second
    // link, keeping the "없음" assertion specific to the deadline field
    vi.mocked(getVisit).mockResolvedValue(
      makeVisit({ reviewDeadline: null, postUrl: 'https://blog.example.com' }),
    )
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('없음')).toBeInTheDocument()
  })

  it('shows the review deadline date with its D-day text when set', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ reviewDeadline: '2099-01-01' }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText(/2099-01-01 \(D-/)).toBeInTheDocument()
  })
})

describe('EditPage edit mode', () => {
  it('switches to a pre-filled form, and cancel returns to view without saving', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ storeName: '카페 온도' }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })

    await userEvent.click(screen.getByRole('button', { name: '수정' }))
    expect(screen.getByLabelText('업체명')).toHaveValue('카페 온도')

    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(updateVisit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
  })

  it('saves via updateVisit and shows the updated value back in view mode', async () => {
    const visit = makeVisit({ storeName: '카페 온도' })
    vi.mocked(getVisit).mockResolvedValue(visit)
    vi.mocked(updateVisit).mockResolvedValue({ ...visit, storeName: '변경된 이름' })
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })

    await userEvent.click(screen.getByRole('button', { name: '수정' }))
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(updateVisit).toHaveBeenCalledWith('1', expect.objectContaining({ storeName: '카페 온도' }))
    expect(await screen.findByRole('heading', { name: '변경된 이름' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
  })
})

describe('EditPage delete', () => {
  it('does not call deleteVisit when the confirm dialog is dismissed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    vi.mocked(getVisit).mockResolvedValue(makeVisit({}))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })

    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(deleteVisit).not.toHaveBeenCalled()
  })

  it('deletes and navigates to /table on confirmed success', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ id: '1' }))
    vi.mocked(deleteVisit).mockResolvedValue(undefined)
    renderEditPage('1')
    await screen.findByRole('heading', { name: '카페 온도' })

    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(deleteVisit).toHaveBeenCalledWith('1')
    expect(await screen.findByText('표 화면')).toBeInTheDocument()
  })

  it('shows an error message and stays on the page when delete fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(getVisit).mockResolvedValue(makeVisit({}))
    vi.mocked(deleteVisit).mockRejectedValue(new Error('network error'))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })

    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(await screen.findByText('삭제에 실패했습니다.')).toBeInTheDocument()
    expect(screen.queryByText('표 화면')).not.toBeInTheDocument()
  })
})
