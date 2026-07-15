import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EditPage from './EditPage'
import { deleteVisit, getVisit, updateVisit } from '../lib/visits'
import { makeVisit } from '../test/factories'
import type { Visit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  getVisit: vi.fn(),
  updateVisit: vi.fn(),
  deleteVisit: vi.fn(),
}))

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

  it('clears a previous load error after navigating to a valid id', async () => {
    vi.mocked(getVisit).mockRejectedValueOnce(new Error('not found'))
    const router = createMemoryRouter(
      [
        { path: '/edit/:id', element: <EditPage /> },
        { path: '/table', element: <div>표 화면</div> },
      ],
      { initialEntries: ['/edit/bad-id'] },
    )
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('기록을 불러오지 못했습니다.')).toBeInTheDocument()

    vi.mocked(getVisit).mockResolvedValueOnce(makeVisit({ id: '2', storeName: '카페 온도' }))
    await router.navigate('/edit/2')

    expect(await screen.findByRole('heading', { name: '카페 온도' })).toBeInTheDocument()
    expect(screen.queryByText('기록을 불러오지 못했습니다.')).not.toBeInTheDocument()
  })

  it('ignores a stale response for a previous id after navigating to a new id', async () => {
    let resolveFirst!: (v: Visit) => void
    const firstLoad = new Promise<Visit>((resolve) => {
      resolveFirst = resolve
    })
    vi.mocked(getVisit).mockReturnValueOnce(firstLoad)
    const router = createMemoryRouter(
      [
        { path: '/edit/:id', element: <EditPage /> },
        { path: '/table', element: <div>표 화면</div> },
      ],
      { initialEntries: ['/edit/1'] },
    )
    render(<RouterProvider router={router} />)

    vi.mocked(getVisit).mockResolvedValueOnce(makeVisit({ id: '2', storeName: '가게B' }))
    await router.navigate('/edit/2')
    expect(await screen.findByRole('heading', { name: '가게B' })).toBeInTheDocument()

    resolveFirst(makeVisit({ id: '1', storeName: '가게A' }))
    await new Promise((r) => setTimeout(r, 20))

    expect(screen.getByRole('heading', { name: '가게B' })).toBeInTheDocument()
  })
})

describe('EditPage view mode', () => {
  it('renders the visit fields', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({}))
    renderEditPage()

    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('체험(예정)일')).toBeInTheDocument()
    expect(screen.getByText('2026-01-10')).toBeInTheDocument()
    expect(screen.getByText('포포몬')).toBeInTheDocument()
    expect(screen.getByText('카페')).toBeInTheDocument()
    expect(screen.getByText('음료 2')).toBeInTheDocument()
    expect(screen.getByText('₩10,000')).toBeInTheDocument()
    expect(screen.getByText('예정')).toBeInTheDocument()
  })

  it('shows a link row for each filled link, and omits the row for a missing one', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ postUrls: [] }))
    renderEditPage()

    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByRole('link', { name: 'https://store.example.com' })).toHaveAttribute(
      'href',
      'https://store.example.com',
    )
    expect(screen.getByRole('link', { name: 'https://campaign.example.com' })).toHaveAttribute(
      'href',
      'https://campaign.example.com',
    )
    expect(screen.queryByText('포스팅 링크')).not.toBeInTheDocument()
  })

  it('shows a row for 포스팅 링크 once it is filled', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ postUrls: ['https://blog.example.com'] }))
    renderEditPage()

    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByRole('link', { name: 'https://blog.example.com' })).toHaveAttribute(
      'href',
      'https://blog.example.com',
    )
  })

  it('shows review types joined by comma', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ reviewTypes: ['블로그', '릴스'] }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('블로그, 릴스')).toBeInTheDocument()
  })

  it('shows "-" for review types when none are set', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ reviewTypes: [] }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('리뷰 타입').nextElementSibling).toHaveTextContent('-')
  })

  it('numbers post URL rows when there is more than one', async () => {
    vi.mocked(getVisit).mockResolvedValue(
      makeVisit({ postUrls: ['https://blog.example.com/a', 'https://blog.example.com/b'] }),
    )
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('포스팅 링크 1')).toBeInTheDocument()
    expect(screen.getByText('포스팅 링크 2')).toBeInTheDocument()
  })

  it('shows "-" when there is no visit date', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ visitDate: null }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('체험(예정)일').nextElementSibling).toHaveTextContent('-')
  })

  it('shows 품목 제공 for the 체험가 field when retailValue is null (품목형 방문)', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ retailValue: null }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('체험가').nextElementSibling).toHaveTextContent('품목 제공')
  })

  it('shows the reservation note when present', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ reservationNote: '예약 필수, 저녁 7시' }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('예약 필수, 저녁 7시')).toBeInTheDocument()
  })

  it('shows "-" for the reservation note when it is null', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ reservationNote: null }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('예약 정보').nextElementSibling).toHaveTextContent('-')
  })

  it('shows "없음" when there is no review deadline', async () => {
    // fix postUrl to a real link so its own "바로가기" doesn't add a second
    // link, keeping the "없음" assertion specific to the deadline field
    vi.mocked(getVisit).mockResolvedValue(
      makeVisit({ reviewDeadline: null, postUrls: ['https://blog.example.com'] }),
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

  it('shows a reviewed deadline as just the date, since the 상태 badge below already says 리뷰완료', async () => {
    vi.mocked(getVisit).mockResolvedValue(
      makeVisit({ reviewDeadline: '2099-01-01', status: '리뷰완료' }),
    )
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })
    expect(screen.getByText('2099-01-01')).toBeInTheDocument()
  })

  it('navigates back to the previous page when the back button is clicked', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({}))
    render(
      <MemoryRouter initialEntries={['/table', '/edit/1']} initialIndex={1}>
        <Routes>
          <Route path="/edit/:id" element={<EditPage />} />
          <Route path="/table" element={<div>표 화면</div>} />
        </Routes>
      </MemoryRouter>,
    )
    await screen.findByRole('heading', { name: '카페 온도' })

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(await screen.findByText('표 화면')).toBeInTheDocument()
  })
})

describe('EditPage edit mode', () => {
  it('keeps the store name as the heading instead of replacing it, and shows a small "수정 중" badge', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ storeName: '카페 온도' }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })

    await userEvent.click(screen.getByRole('button', { name: '수정' }))

    expect(screen.getByRole('heading', { name: '카페 온도' })).toBeInTheDocument()
    expect(screen.getByText('수정 중')).toBeInTheDocument()
  })

  it('also shows the back button while editing', async () => {
    vi.mocked(getVisit).mockResolvedValue(makeVisit({ storeName: '카페 온도' }))
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })

    await userEvent.click(screen.getByRole('button', { name: '수정' }))

    expect(screen.getByRole('button', { name: '뒤로가기' })).toBeInTheDocument()
  })

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

  it('disables the cancel button while a save is in flight, so it cannot discard-then-reapply a pending edit', async () => {
    let resolveSave!: (v: Visit) => void
    const pendingSave = new Promise<Visit>((resolve) => {
      resolveSave = resolve
    })
    const visit = makeVisit({ storeName: '카페 온도', reviewDeadline: '2026-09-01', reviewTypes: ['블로그'] })
    vi.mocked(getVisit).mockResolvedValue(visit)
    vi.mocked(updateVisit).mockReturnValue(pendingSave)
    renderEditPage()
    await screen.findByRole('heading', { name: '카페 온도' })

    await userEvent.click(screen.getByRole('button', { name: '수정' }))
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled()

    resolveSave({ ...visit, storeName: '변경된 이름' })
    await screen.findByRole('heading', { name: '변경된 이름' })
  })

  it('saves via updateVisit and shows the updated value back in view mode', async () => {
    const visit = makeVisit({ storeName: '카페 온도', reviewDeadline: '2026-09-01', reviewTypes: ['블로그'] })
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
