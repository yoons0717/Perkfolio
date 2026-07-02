import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'
import { signInWithPassword } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  signInWithPassword: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
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
})
