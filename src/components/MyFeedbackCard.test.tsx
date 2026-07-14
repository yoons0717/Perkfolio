import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MyFeedbackCard from './MyFeedbackCard'
import { useAuth } from '../context/AuthContext'
import { deleteFeedback, getMyFeedbackList } from '../lib/feedback'
import { makeFeedback } from '../test/factories'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/feedback', () => ({
  getMyFeedbackList: vi.fn(),
  deleteFeedback: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function mockSession() {
  vi.mocked(useAuth).mockReturnValue({
    session: { user: { id: 'user-1' } },
    loading: false,
    isPasswordRecovery: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

async function open() {
  await userEvent.click(screen.getByRole('button', { name: /내 문의내역/ }))
}

describe('MyFeedbackCard', () => {
  it('renders nothing when there is no session', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: false, isPasswordRecovery: false })
    const { container } = render(<MyFeedbackCard />)

    expect(container).toBeEmptyDOMElement()
  })

  it('starts collapsed, showing neither the empty state nor the list', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', content: '다크모드 추가해주세요' }),
    ])
    render(<MyFeedbackCard />)

    await screen.findByRole('button', { name: /내 문의내역 \(1\)/ })
    expect(screen.queryByText('다크모드 추가해주세요')).not.toBeInTheDocument()
  })

  it('shows the item count in the header once loaded, and expands on click', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', content: '다크모드 추가해주세요' }),
      makeFeedback({ id: '2', content: '버튼이 안 눌려요' }),
    ])
    render(<MyFeedbackCard />)

    await screen.findByRole('button', { name: /내 문의내역 \(2\)/ })
    await open()

    expect(screen.getByText('다크모드 추가해주세요')).toBeInTheDocument()
    expect(screen.getByText('버튼이 안 눌려요')).toBeInTheDocument()
  })

  it('collapses again on a second click', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', content: '다크모드 추가해주세요' }),
    ])
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: /내 문의내역/ })

    await open()
    expect(screen.getByText('다크모드 추가해주세요')).toBeInTheDocument()

    await open()
    expect(screen.queryByText('다크모드 추가해주세요')).not.toBeInTheDocument()
  })

  it("fetches only the current user's own feedback, never another user's", async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([])
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: '내 문의내역' })

    expect(getMyFeedbackList).toHaveBeenCalledWith('user-1')
  })

  it('shows an empty state when there is no submitted feedback', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([])
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: '내 문의내역' })
    await open()

    expect(screen.getByText('아직 제출한 문의가 없어요.')).toBeInTheDocument()
  })

  it('shows an error message even while collapsed, so a failed fetch is never silently hidden', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockRejectedValue(new Error('network error'))
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: '내 문의내역' })

    expect(screen.getByText('목록을 불러오지 못했습니다.')).toBeInTheDocument()
  })

  it('shows the admin reply when one exists', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', content: '버튼이 안 눌려요', adminReply: '확인해서 수정했어요', repliedAt: '2026-01-03T00:00:00.000Z' }),
    ])
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: /내 문의내역/ })
    await open()

    expect(screen.getByText('버튼이 안 눌려요')).toBeInTheDocument()
    expect(screen.getByText('확인해서 수정했어요')).toBeInTheDocument()
  })

  it('shows a no-reply-yet message when adminReply is null', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', content: '다크모드 추가해주세요', adminReply: null, repliedAt: null }),
    ])
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: /내 문의내역/ })
    await open()

    expect(screen.getByText('다크모드 추가해주세요')).toBeInTheDocument()
    expect(screen.getByText('답변 대기중')).toBeInTheDocument()
  })

  it('shows a delete button for feedback with no reply yet', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', content: '다크모드 추가해주세요', adminReply: null, repliedAt: null }),
    ])
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: /내 문의내역/ })
    await open()

    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('does not show a delete button once an admin has replied', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', content: '버튼이 안 눌려요', adminReply: '확인해서 수정했어요', repliedAt: '2026-01-03T00:00:00.000Z' }),
    ])
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: /내 문의내역/ })
    await open()

    expect(screen.getByText('버튼이 안 눌려요')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })

  it('deletes the feedback and removes it from the list after confirming', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', content: '다크모드 추가해주세요', adminReply: null, repliedAt: null }),
    ])
    vi.mocked(deleteFeedback).mockResolvedValue(undefined)
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: /내 문의내역/ })
    await open()

    await userEvent.click(screen.getByRole('button', { name: '삭제' }))
    await userEvent.click(screen.getByRole('button', { name: '삭제하기' }))

    expect(deleteFeedback).toHaveBeenCalledWith('1')
    expect(await screen.findByText('아직 제출한 문의가 없어요.')).toBeInTheDocument()
  })

  it('does not delete when the confirmation modal is cancelled', async () => {
    mockSession()
    vi.mocked(getMyFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', content: '다크모드 추가해주세요', adminReply: null, repliedAt: null }),
    ])
    render(<MyFeedbackCard />)
    await screen.findByRole('button', { name: /내 문의내역/ })
    await open()

    await userEvent.click(screen.getByRole('button', { name: '삭제' }))
    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(deleteFeedback).not.toHaveBeenCalled()
    expect(screen.getByText('다크모드 추가해주세요')).toBeInTheDocument()
  })
})
