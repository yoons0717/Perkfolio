import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { getSession, onAuthStateChange } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function Probe() {
  const { session, loading } = useAuth()
  if (loading) return <p>로딩 중</p>
  return <p>{session ? `로그인: ${session.user.id}` : '세션 없음'}</p>
}

describe('AuthProvider', () => {
  it('shows loading until getSession resolves, then reflects the session', async () => {
    let resolveSession!: (s: unknown) => void
    vi.mocked(getSession).mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve
      }) as never,
    )
    vi.mocked(onAuthStateChange).mockReturnValue(vi.fn())

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByText('로딩 중')).toBeInTheDocument()

    resolveSession({ user: { id: '1' } })
    expect(await screen.findByText('로그인: 1')).toBeInTheDocument()
  })

  it('updates the session when onAuthStateChange fires', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    let handler!: (session: unknown) => void
    vi.mocked(onAuthStateChange).mockImplementation((cb) => {
      handler = cb
      return vi.fn()
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await screen.findByText('세션 없음')

    handler({ user: { id: '2' } })

    expect(await screen.findByText('로그인: 2')).toBeInTheDocument()
  })
})
