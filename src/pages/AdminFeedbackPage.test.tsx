import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminFeedbackPage from './AdminFeedbackPage'
import { useAuth } from '../context/AuthContext'
import { getFeedbackList, replyToFeedback } from '../lib/feedback'
import { makeFeedback } from '../test/factories'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/feedback', () => ({
  getFeedbackList: vi.fn(),
  replyToFeedback: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/feedback']}>
      <Routes>
        <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
        <Route path="/table" element={<div>체험단 내역 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminFeedbackPage', () => {
  it('redirects to /table when the session is not the admin account', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { app_metadata: {} } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    renderPage()

    expect(await screen.findByText('체험단 내역 화면')).toBeInTheDocument()
    expect(getFeedbackList).not.toHaveBeenCalled()
  })

  it('renders the feedback list for the admin account', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', type: '버그', content: '버튼이 안 눌려요' }),
      makeFeedback({ id: '2', type: '건의', content: '다크모드 추가해주세요' }),
    ])
    renderPage()

    expect(await screen.findByText('버튼이 안 눌려요')).toBeInTheDocument()
    expect(screen.getByText('다크모드 추가해주세요')).toBeInTheDocument()
    expect(screen.getByText('버그 제보')).toBeInTheDocument()
    expect(screen.getByText('건의사항')).toBeInTheDocument()
  })

  it("shows each feedback item's submitter email", async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', userEmail: 'reporter@example.com' }),
    ])
    renderPage()

    expect(await screen.findByText('reporter@example.com')).toBeInTheDocument()
  })

  it('lets the admin submit a reply when none exists yet', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', adminReply: null, repliedAt: null }),
    ])
    vi.mocked(replyToFeedback).mockResolvedValue(undefined)
    renderPage()

    await screen.findByLabelText('답변')
    await userEvent.type(screen.getByLabelText('답변'), '확인해서 수정했어요')
    await userEvent.click(screen.getByRole('button', { name: '답변 등록' }))

    expect(replyToFeedback).toHaveBeenCalledWith('1', '확인해서 수정했어요')
    expect(await screen.findByText('확인해서 수정했어요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '답변 수정' })).toBeInTheDocument()
  })

  it('shows an existing reply with an edit option instead of the textarea', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', adminReply: '이미 등록된 답변', repliedAt: '2026-01-03T00:00:00.000Z' }),
    ])
    renderPage()

    expect(await screen.findByText('이미 등록된 답변')).toBeInTheDocument()
    expect(screen.queryByLabelText('답변')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '답변 수정' })).toBeInTheDocument()
  })

  it('lets the admin edit an existing reply', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', adminReply: '이전 답변', repliedAt: '2026-01-03T00:00:00.000Z' }),
    ])
    vi.mocked(replyToFeedback).mockResolvedValue(undefined)
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: '답변 수정' }))
    const textarea = screen.getByLabelText('답변')
    expect(textarea).toHaveValue('이전 답변')
    await userEvent.clear(textarea)
    await userEvent.type(textarea, '수정된 답변')
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(replyToFeedback).toHaveBeenCalledWith('1', '수정된 답변')
    expect(await screen.findByText('수정된 답변')).toBeInTheDocument()
  })

  it('shows an error message when the reply fails to submit', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockResolvedValue([
      makeFeedback({ id: '1', adminReply: null, repliedAt: null }),
    ])
    vi.mocked(replyToFeedback).mockRejectedValue(new Error('network error'))
    renderPage()

    await screen.findByLabelText('답변')
    await userEvent.type(screen.getByLabelText('답변'), '답변')
    await userEvent.click(screen.getByRole('button', { name: '답변 등록' }))

    expect(await screen.findByText('답변 등록에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument()
  })

  it('shows a placeholder when there is no feedback yet', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('아직 접수된 내용이 없습니다.')).toBeInTheDocument()
  })

  it('shows an error message when the list fails to load', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockRejectedValue(new Error('network error'))
    renderPage()

    expect(await screen.findByText('목록을 불러오지 못했습니다.')).toBeInTheDocument()
  })
})
