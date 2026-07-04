import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { getSession, isRecoverySession, onAuthStateChange } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  isRecoverySession: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function Probe() {
  const { session, loading, isPasswordRecovery } = useAuth()
  if (loading) return <p>로딩 중</p>
  return (
    <p>
      {session ? `로그인: ${session.user.id}` : '세션 없음'}
      {isPasswordRecovery ? ' (복구 세션)' : ''}
    </p>
  )
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

  it('stops loading once onAuthStateChange delivers a session, even if getSession never resolves', async () => {
    vi.mocked(getSession).mockReturnValue(new Promise(() => {}) as never)
    let handler!: (event: string, session: unknown) => void
    vi.mocked(onAuthStateChange).mockImplementation((cb) => {
      handler = cb
      return vi.fn()
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByText('로딩 중')).toBeInTheDocument()

    handler('SIGNED_IN', { user: { id: '1' } })

    expect(await screen.findByText('로그인: 1')).toBeInTheDocument()
  })

  it('updates the session when onAuthStateChange fires', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    let handler!: (event: string, session: unknown) => void
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

    handler('SIGNED_IN', { user: { id: '2' } })

    expect(await screen.findByText('로그인: 2')).toBeInTheDocument()
  })

  it('flags isPasswordRecovery when a PASSWORD_RECOVERY event fires, so a reset link is not treated as a normal login', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    let handler!: (event: string, session: unknown) => void
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

    handler('PASSWORD_RECOVERY', { user: { id: '1' } })

    expect(await screen.findByText('로그인: 1 (복구 세션)')).toBeInTheDocument()
  })

  it('clears isPasswordRecovery once a real SIGNED_IN event follows a recovery session', async () => {
    vi.mocked(getSession).mockResolvedValue(null)
    let handler!: (event: string, session: unknown) => void
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

    handler('PASSWORD_RECOVERY', { user: { id: '1' } })
    await screen.findByText('로그인: 1 (복구 세션)')

    handler('SIGNED_IN', { user: { id: '1' } })

    expect(await screen.findByText('로그인: 1')).toBeInTheDocument()
  })

  it('flags isPasswordRecovery from the session itself (e.g. restored by getSession after a reload), even without seeing a PASSWORD_RECOVERY event', async () => {
    const recoverySession = { user: { id: '1' } }
    vi.mocked(getSession).mockResolvedValue(recoverySession as never)
    vi.mocked(onAuthStateChange).mockReturnValue(vi.fn())
    vi.mocked(isRecoverySession).mockImplementation((s) => s === recoverySession)

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )

    expect(await screen.findByText('로그인: 1 (복구 세션)')).toBeInTheDocument()
  })
})
