import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SignupPage from './SignupPage'
import { signUpWithPassword } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  signUpWithPassword: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderSignupPage() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/table" element={<div>표 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email: string, password: string, confirm: string) {
  await userEvent.type(screen.getByPlaceholderText('이메일'), email)
  await userEvent.type(screen.getByPlaceholderText('비밀번호'), password)
  await userEvent.type(screen.getByPlaceholderText('비밀번호 확인'), confirm)
  await userEvent.click(screen.getByRole('button', { name: '회원가입' }))
}

describe('SignupPage', () => {
  it('shows a confirmation message instead of navigating when email verification is required', async () => {
    vi.mocked(signUpWithPassword).mockResolvedValue({
      data: { session: null, user: { identities: [{ id: '1' }] } },
      error: null,
    } as never)
    renderSignupPage()

    await fillAndSubmit('user@example.com', 'password123', 'password123')

    expect(signUpWithPassword).toHaveBeenCalledWith('user@example.com', 'password123')
    expect(await screen.findByText('가입 확인 이메일을 보냈습니다. 메일함을 확인해주세요.')).toBeInTheDocument()
    expect(screen.queryByText('표 화면')).not.toBeInTheDocument()
  })

  it('shows an "already registered" message instead of a false confirmation when Supabase returns its anti-enumeration empty-identities response', async () => {
    vi.mocked(signUpWithPassword).mockResolvedValue({
      data: { session: null, user: { identities: [] } },
      error: null,
    } as never)
    renderSignupPage()

    await fillAndSubmit('user@example.com', 'password123', 'password123')

    expect(await screen.findByText('이미 가입된 이메일입니다. 로그인해주세요.')).toBeInTheDocument()
    expect(screen.queryByText('가입 확인 이메일을 보냈습니다. 메일함을 확인해주세요.')).not.toBeInTheDocument()
  })

  it('navigates to /table when signup returns an active session (auto-confirmed)', async () => {
    vi.mocked(signUpWithPassword).mockResolvedValue({ data: { session: {} }, error: null } as never)
    renderSignupPage()

    await fillAndSubmit('user@example.com', 'password123', 'password123')

    expect(await screen.findByText('표 화면')).toBeInTheDocument()
  })

  it('shows an error without calling signUpWithPassword when the passwords do not match', async () => {
    renderSignupPage()

    await fillAndSubmit('user@example.com', 'password123', 'password456')

    expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument()
    expect(signUpWithPassword).not.toHaveBeenCalled()
  })

  it('shows an error message and stays on the page when signup fails', async () => {
    vi.mocked(signUpWithPassword).mockResolvedValue({
      data: { session: null },
      error: { message: 'User already registered' },
    } as never)
    renderSignupPage()

    await fillAndSubmit('user@example.com', 'password123', 'password123')

    expect(await screen.findByText('회원가입에 실패했습니다.')).toBeInTheDocument()
    expect(screen.queryByText('표 화면')).not.toBeInTheDocument()
  })

  it('re-enables the submit button after a rejected signUp call (e.g. network error)', async () => {
    vi.mocked(signUpWithPassword).mockRejectedValue(new Error('network error'))
    renderSignupPage()

    await fillAndSubmit('user@example.com', 'password123', 'password123')

    expect(await screen.findByRole('button', { name: '회원가입' })).not.toBeDisabled()
  })
})
