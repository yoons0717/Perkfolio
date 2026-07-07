import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import LandingPage from './LandingPage'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderLandingPage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/table" element={<div>표 화면</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('renders intro content and CTA links when logged out', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: false, isPasswordRecovery: false } as never)

    renderLandingPage()

    expect(screen.getByText('표·캘린더 뷰')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login')
  })

  it('redirects to /table when a session already exists', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)

    renderLandingPage()

    expect(await screen.findByText('표 화면')).toBeInTheDocument()
  })

  it('renders nothing while the session is still loading', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: true, isPasswordRecovery: false } as never)

    const { container } = renderLandingPage()

    expect(container).toBeEmptyDOMElement()
  })
})
