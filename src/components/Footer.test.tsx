import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Footer from './Footer'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/feedback', () => ({
  addFeedback: vi.fn(),
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

  it('shows the copyright text and a 문의하기 button', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    render(<Footer />)

    expect(screen.getByText('© 2026 PerkTrack')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '문의하기' })).toBeInTheDocument()
  })

  it('opens the feedback modal when 문의하기 is clicked', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    render(<Footer />)

    await userEvent.click(screen.getByRole('button', { name: '문의하기' }))

    expect(screen.getByRole('heading', { name: '문의하기' })).toBeInTheDocument()
  })
})
