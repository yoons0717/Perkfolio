import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Footer from './Footer'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('Footer', () => {
  it('renders nothing when there is no session', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: false, isPasswordRecovery: false })
    const { container } = render(<Footer />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing during a password-recovery session', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: true,
    } as never)
    const { container } = render(<Footer />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the copyright text', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    render(<Footer />)

    expect(screen.getByText('© 2026 PerkTrack')).toBeInTheDocument()
  })
})
