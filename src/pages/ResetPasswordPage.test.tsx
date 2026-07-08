import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ResetPasswordPage from './ResetPasswordPage'
import { signOut, updatePassword } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  updatePassword: vi.fn(),
  signOut: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderResetPasswordPage() {
  return render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login" element={<div>로그인 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(password: string, confirm: string) {
  await userEvent.type(screen.getByPlaceholderText('새 비밀번호'), password)
  await userEvent.type(screen.getByPlaceholderText('새 비밀번호 확인'), confirm)
  await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }))
}

describe('ResetPasswordPage', () => {
  it('updates the password, signs out the recovery session, and navigates to /login on success', async () => {
    vi.mocked(updatePassword).mockResolvedValue({ data: {}, error: null } as never)
    vi.mocked(signOut).mockResolvedValue({ error: null } as never)
    renderResetPasswordPage()

    await fillAndSubmit('NewPassword123!', 'NewPassword123!')

    expect(updatePassword).toHaveBeenCalledWith('NewPassword123!')
    expect(signOut).toHaveBeenCalled()
    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
  })

  it('disables the submit button when the passwords do not match', async () => {
    renderResetPasswordPage()

    await userEvent.type(screen.getByPlaceholderText('새 비밀번호'), 'NewPassword123!')
    await userEvent.type(screen.getByPlaceholderText('새 비밀번호 확인'), 'somethingelse')

    expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeDisabled()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('disables the submit button when the password is too weak', async () => {
    renderResetPasswordPage()

    await userEvent.type(screen.getByPlaceholderText('새 비밀번호'), 'password1')
    await userEvent.type(screen.getByPlaceholderText('새 비밀번호 확인'), 'password1')

    expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeDisabled()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('shows an error message and stays on the page when the update fails', async () => {
    vi.mocked(updatePassword).mockResolvedValue({
      data: {},
      error: { message: 'invalid session' },
    } as never)
    renderResetPasswordPage()

    await fillAndSubmit('NewPassword123!', 'NewPassword123!')

    expect(await screen.findByText('비밀번호 변경에 실패했습니다.')).toBeInTheDocument()
    expect(screen.queryByText('로그인 화면')).not.toBeInTheDocument()
  })

  it('re-enables the submit button after a rejected call (e.g. network error)', async () => {
    vi.mocked(updatePassword).mockRejectedValue(new Error('network error'))
    renderResetPasswordPage()

    await fillAndSubmit('NewPassword123!', 'NewPassword123!')

    expect(await screen.findByRole('button', { name: '비밀번호 변경' })).not.toBeDisabled()
  })

  it('still navigates to /login even when signOut fails, since the password was already changed', async () => {
    vi.mocked(updatePassword).mockResolvedValue({ data: {}, error: null } as never)
    vi.mocked(signOut).mockRejectedValue(new Error('network error'))
    renderResetPasswordPage()

    await fillAndSubmit('NewPassword123!', 'NewPassword123!')

    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
  })

  it('links back to the login page', () => {
    renderResetPasswordPage()

    expect(screen.getByRole('link', { name: '로그인으로 돌아가기' })).toHaveAttribute('href', '/login')
  })
})
