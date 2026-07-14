import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MyPage from './MyPage'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/auth', () => ({
  signOut: vi.fn(),
}))

vi.mock('../lib/feedback', () => ({
  addFeedback: vi.fn(),
}))

vi.mock('../components/DeleteAccountModal', () => ({
  default: ({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) => (
    <div>
      <button onClick={onClose}>모달 닫기</button>
      <button onClick={onDeleted}>모달 확인</button>
    </div>
  ),
}))

vi.mock('../components/BlogLinkCard', () => ({
  default: () => <div>블로그 연동 카드</div>,
}))

vi.mock('../components/MyFeedbackCard', () => ({
  default: () => <div>내 문의내역 카드</div>,
}))

afterEach(() => {
  vi.clearAllMocks()
})

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    session: { user: { id: '1', app_metadata: {} } },
    loading: false,
    isPasswordRecovery: false,
  } as never)
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/mypage']}>
      <Routes>
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/login" element={<div>로그인 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('MyPage', () => {
  it('opens the delete account modal on button click', async () => {
    renderPage()

    expect(screen.queryByText('모달 닫기')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))

    expect(screen.getByText('모달 닫기')).toBeInTheDocument()
  })

  it('closes the modal without signing out when closed', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    await userEvent.click(screen.getByText('모달 닫기'))

    expect(screen.queryByText('모달 닫기')).not.toBeInTheDocument()
    expect(signOut).not.toHaveBeenCalled()
  })

  it('signs out and navigates to the login page when the account is deleted', async () => {
    vi.mocked(signOut).mockResolvedValue({ error: null } as never)
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    await userEvent.click(screen.getByText('모달 확인'))

    expect(signOut).toHaveBeenCalled()
    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
  })

  it('still navigates to /login when signOut fails after deletion, since the account is already gone', async () => {
    vi.mocked(signOut).mockResolvedValue({ error: new Error('network error') } as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }))
    await userEvent.click(screen.getByText('모달 확인'))

    expect(signOut).toHaveBeenCalled()
    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
  })

  it('renders the blog link card', () => {
    renderPage()

    expect(screen.getByText('블로그 연동 카드')).toBeInTheDocument()
  })

  it('renders the feedback history card', () => {
    renderPage()

    expect(screen.getByText('내 문의내역 카드')).toBeInTheDocument()
  })

  it('signs out and navigates to /login when 로그아웃 is clicked', async () => {
    vi.mocked(signOut).mockResolvedValue({ error: null } as never)
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(signOut).toHaveBeenCalled()
    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
  })

  it('opens the feedback modal when 문의하기 is clicked', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: '문의하기' }))

    expect(screen.getByRole('heading', { name: '문의하기' })).toBeInTheDocument()
  })

  it('shows an admin link when the session has the admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1', app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    renderPage()

    expect(screen.getByRole('link', { name: '관리자 페이지' })).toHaveAttribute('href', '/admin/feedback')
  })

  it('does not show an admin link for a non-admin session', () => {
    renderPage()

    expect(screen.queryByRole('link', { name: '관리자 페이지' })).not.toBeInTheDocument()
  })

  it('toggles the theme when the 화면 테마 row is clicked anywhere, not just the icon', async () => {
    localStorage.setItem('perktrack-theme', 'dark')
    renderPage()
    expect(document.documentElement.dataset.theme).not.toBe('light')

    await userEvent.click(screen.getByRole('button', { name: /화면 테마/ }))

    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('perktrack-theme')).toBe('light')
  })
})
