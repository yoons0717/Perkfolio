import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ProtectedRoute from './ProtectedRoute'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/table']}>
      <Routes>
        <Route
          path="/table"
          element={
            <ProtectedRoute>
              <div>보호된 화면</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>로그인 화면</div>} />
        <Route path="/reset-password" element={<div>비밀번호 재설정 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('renders children when there is a normal session', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)

    renderProtected()

    expect(screen.getByText('보호된 화면')).toBeInTheDocument()
  })

  it('redirects to /login when there is no session', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: false, isPasswordRecovery: false } as never)

    renderProtected()

    expect(screen.getByText('로그인 화면')).toBeInTheDocument()
  })

  it('redirects to /reset-password instead of rendering protected content during a password-recovery session', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: true,
    } as never)

    renderProtected()

    expect(screen.getByText('비밀번호 재설정 화면')).toBeInTheDocument()
    expect(screen.queryByText('보호된 화면')).not.toBeInTheDocument()
  })
})
