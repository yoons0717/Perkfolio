import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, MemoryRouter, Route, RouterProvider, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'
import { signInWithPassword } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  signInWithPassword: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderLoginPage(initialEntries: Array<string | { pathname: string; state?: unknown }> = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/table" element={<div>표 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('logs in and navigates to /table on success', async () => {
    vi.mocked(signInWithPassword).mockResolvedValue({ data: {}, error: null } as never)
    renderLoginPage()

    await userEvent.type(screen.getByPlaceholderText('이메일'), 'user@example.com')
    await userEvent.type(screen.getByPlaceholderText('비밀번호'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(signInWithPassword).toHaveBeenCalledWith('user@example.com', 'password123')
    expect(await screen.findByText('표 화면')).toBeInTheDocument()
  })

  it('re-enables the submit button after a rejected signIn call (e.g. network error)', async () => {
    vi.mocked(signInWithPassword).mockRejectedValue(new Error('network error'))
    renderLoginPage()

    await userEvent.type(screen.getByPlaceholderText('이메일'), 'user@example.com')
    await userEvent.type(screen.getByPlaceholderText('비밀번호'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('button', { name: '로그인' })).not.toBeDisabled()
  })

  it('shows an error message and stays on the page on failure', async () => {
    vi.mocked(signInWithPassword).mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    } as never)
    renderLoginPage()

    await userEvent.type(screen.getByPlaceholderText('이메일'), 'user@example.com')
    await userEvent.type(screen.getByPlaceholderText('비밀번호'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByText('이메일 또는 비밀번호가 올바르지 않습니다.')).toBeInTheDocument()
    expect(screen.queryByText('표 화면')).not.toBeInTheDocument()
  })

  it('links to the signup and forgot-password pages', () => {
    renderLoginPage()

    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: '비밀번호 찾기' })).toHaveAttribute('href', '/forgot-password')
  })

  it('shows a success message when arriving after a password reset', () => {
    renderLoginPage([{ pathname: '/login', state: { passwordResetSuccess: true } }])

    expect(screen.getByText('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.')).toBeInTheDocument()
  })

  it('clears the reset-success flag from history so navigating back later would not re-show the banner', async () => {
    const router = createMemoryRouter(
      [
        { path: '/login', element: <LoginPage /> },
        { path: '/table', element: <div>표 화면</div> },
      ],
      { initialEntries: [{ pathname: '/login', state: { passwordResetSuccess: true } }] },
    )
    render(<RouterProvider router={router} />)

    await screen.findByText('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.')

    expect(router.state.location.state).not.toMatchObject({ passwordResetSuccess: true })
  })
})
