import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSession, onAuthStateChange, signInWithPassword, signOut } from './auth'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('getSession', () => {
  it('resolves to the current session', async () => {
    const session = { user: { id: '1' } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session }, error: null } as any)

    await expect(getSession()).resolves.toBe(session)
  })

  it('resolves to null when there is no session', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null }, error: null } as any)

    await expect(getSession()).resolves.toBeNull()
  })
})

describe('onAuthStateChange', () => {
  it('forwards the session from the auth event to the callback', () => {
    let handler: (event: string, session: unknown) => void = () => {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(((cb: typeof handler) => {
      handler = cb
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    }) as any)
    const callback = vi.fn()

    onAuthStateChange(callback)
    const session = { user: { id: '1' } }
    handler('SIGNED_IN', session)

    expect(callback).toHaveBeenCalledWith(session)
  })

  it('returns a function that unsubscribes the underlying listener', () => {
    const unsubscribe = vi.fn()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: { unsubscribe } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const stop = onAuthStateChange(vi.fn())
    stop()

    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('signInWithPassword', () => {
  it('delegates to supabase with email and password', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: null } as any)

    await signInWithPassword('a@b.com', 'pw')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
  })

  it('resolves with the error supabase returns on failed login', async () => {
    const error = { message: 'Invalid login credentials' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error } as any)

    await expect(signInWithPassword('a@b.com', 'wrong')).resolves.toEqual({ data: {}, error })
  })
})

describe('signOut', () => {
  it('delegates to supabase', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any)

    await signOut()

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})
