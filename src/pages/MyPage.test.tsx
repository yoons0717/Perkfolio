import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MyPage from './MyPage'
import { signOut } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  signOut: vi.fn(),
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

afterEach(() => {
  vi.clearAllMocks()
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

  it('still navigates to /login when signOut throws after deletion, since the account is already gone', async () => {
    vi.mocked(signOut).mockRejectedValue(new Error('network error'))
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
})
