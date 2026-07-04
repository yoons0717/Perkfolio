import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import NavBar from './NavBar'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/auth', () => ({
  signOut: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderNavBar() {
  return render(
    <MemoryRouter initialEntries={['/table']}>
      <Routes>
        <Route path="/table" element={<NavBar />} />
        <Route path="/login" element={<div>로그인 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NavBar', () => {
  it('renders nothing when there is no session', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: false })
    const { container } = renderNavBar()

    expect(container).toBeEmptyDOMElement()
  })

  it('links the Perkfolio logo to /table (home)', () => {
    vi.mocked(useAuth).mockReturnValue({ session: { user: { id: '1' } }, loading: false } as never)
    renderNavBar()

    expect(screen.getByRole('link', { name: 'Perkfolio' })).toHaveAttribute('href', '/table')
  })

  it('logs out and navigates to /login when clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({ session: { user: { id: '1' } }, loading: false } as never)
    vi.mocked(signOut).mockResolvedValue({ error: null } as never)
    renderNavBar()

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(signOut).toHaveBeenCalled()
    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
  })

  it('renders nothing during a password-recovery session, even though a session exists', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: true,
    } as never)
    const { container } = renderNavBar()

    expect(container).toBeEmptyDOMElement()
  })
})
