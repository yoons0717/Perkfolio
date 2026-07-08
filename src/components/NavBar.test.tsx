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

vi.mock('../lib/feedback', () => ({
  addFeedback: vi.fn(),
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
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: false, isPasswordRecovery: false })
    const { container } = renderNavBar()

    expect(container).toBeEmptyDOMElement()
  })

  it('links the PerkTrack logo to /table (home)', () => {
    vi.mocked(useAuth).mockReturnValue({ session: { user: { id: '1' } }, loading: false } as never)
    renderNavBar()

    expect(screen.getByRole('link', { name: 'PerkTrack' })).toHaveAttribute('href', '/table')
  })

  it('logs out and navigates to /login when clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({ session: { user: { id: '1' } }, loading: false } as never)
    vi.mocked(signOut).mockResolvedValue({ error: null } as never)
    renderNavBar()

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(signOut).toHaveBeenCalled()
    expect(await screen.findByText('로그인 화면')).toBeInTheDocument()
  })

  it('does not navigate to /login when signOut fails, leaving the session intact', async () => {
    vi.mocked(useAuth).mockReturnValue({ session: { user: { id: '1' } }, loading: false } as never)
    vi.mocked(signOut).mockResolvedValue({ error: new Error('network error') } as never)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderNavBar()

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))

    expect(signOut).toHaveBeenCalled()
    expect(screen.queryByText('로그인 화면')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument()
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

  it('shows an admin link when the session has the admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1', app_metadata: { role: 'admin' } } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    renderNavBar()

    expect(screen.getByRole('link', { name: '관리자' })).toHaveAttribute('href', '/admin/feedback')
  })

  it('does not show an admin link for a non-admin session', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1', app_metadata: {} } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    renderNavBar()

    expect(screen.queryByRole('link', { name: '관리자' })).not.toBeInTheDocument()
  })

  it('opens the feedback modal when 문의하기 is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({ session: { user: { id: '1' } }, loading: false } as never)
    renderNavBar()

    await userEvent.click(screen.getByRole('button', { name: '문의하기' }))

    expect(screen.getByRole('heading', { name: '문의하기' })).toBeInTheDocument()
  })
})
