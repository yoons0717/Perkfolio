import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BottomTabBar from './BottomTabBar'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderTabBar(path = '/table') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={<BottomTabBar />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BottomTabBar', () => {
  it('renders nothing when there is no session', () => {
    vi.mocked(useAuth).mockReturnValue({ session: null, loading: false, isPasswordRecovery: false })
    const { container } = renderTabBar()

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing during a password-recovery session', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: true,
    } as never)
    const { container } = renderTabBar()

    expect(container).toBeEmptyDOMElement()
  })

  it('links each tab to its route', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    renderTabBar()

    expect(screen.getByRole('link', { name: /체험단내역/ })).toHaveAttribute('href', '/table')
    expect(screen.getByRole('link', { name: /대시보드/ })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: /마이페이지/ })).toHaveAttribute('href', '/mypage')
  })

  it('marks 체험단내역 active for /calendar too, and leaves the others inactive', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1' } },
      loading: false,
      isPasswordRecovery: false,
    } as never)
    renderTabBar('/calendar')

    expect(screen.getByRole('link', { name: /체험단내역/ })).toHaveClass('text-blue')
    expect(screen.getByRole('link', { name: /대시보드/ })).toHaveClass('text-muted')
    expect(screen.getByRole('link', { name: /마이페이지/ })).toHaveClass('text-muted')
  })
})
