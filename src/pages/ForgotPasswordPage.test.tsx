import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ForgotPasswordPage from './ForgotPasswordPage'
import { resetPasswordForEmail } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  resetPasswordForEmail: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderForgotPasswordPage() {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ForgotPasswordPage', () => {
  it('sends a reset link and shows a confirmation message', async () => {
    vi.mocked(resetPasswordForEmail).mockResolvedValue({ data: {}, error: null } as never)
    renderForgotPasswordPage()

    await userEvent.type(screen.getByPlaceholderText('이메일'), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }))

    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@example.com')
    expect(await screen.findByText('비밀번호 재설정 링크를 이메일로 보냈습니다.')).toBeInTheDocument()
  })

  it('shows an error message when sending the reset link fails', async () => {
    vi.mocked(resetPasswordForEmail).mockResolvedValue({
      data: {},
      error: { message: 'rate limit' },
    } as never)
    renderForgotPasswordPage()

    await userEvent.type(screen.getByPlaceholderText('이메일'), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }))

    expect(await screen.findByText('재설정 링크 전송에 실패했습니다.')).toBeInTheDocument()
  })

  it('re-enables the submit button after a rejected call (e.g. network error)', async () => {
    vi.mocked(resetPasswordForEmail).mockRejectedValue(new Error('network error'))
    renderForgotPasswordPage()

    await userEvent.type(screen.getByPlaceholderText('이메일'), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: '재설정 링크 보내기' }))

    expect(await screen.findByRole('button', { name: '재설정 링크 보내기' })).not.toBeDisabled()
  })
})
