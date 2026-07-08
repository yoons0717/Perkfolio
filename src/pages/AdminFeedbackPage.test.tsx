import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminFeedbackPage from './AdminFeedbackPage'
import { useAuth } from '../context/AuthContext'
import { getFeedbackList } from '../lib/feedback'
import { makeFeedback } from '../test/factories'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/feedback', () => ({
  getFeedbackList: vi.fn(),
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
      session: { user: { email: 'other@example.com' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    renderPage()

    expect(await screen.findByText('체험단 내역 화면')).toBeInTheDocument()
    expect(getFeedbackList).not.toHaveBeenCalled()
  })

  it('renders the feedback list for the admin account', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { email: 'yoons0717@gmail.com' } },
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

  it('shows a placeholder when there is no feedback yet', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { email: 'yoons0717@gmail.com' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('아직 접수된 내용이 없습니다.')).toBeInTheDocument()
  })

  it('shows an error message when the list fails to load', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { email: 'yoons0717@gmail.com' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    vi.mocked(getFeedbackList).mockRejectedValue(new Error('network error'))
    renderPage()

    expect(await screen.findByText('목록을 불러오지 못했습니다.')).toBeInTheDocument()
  })
})
