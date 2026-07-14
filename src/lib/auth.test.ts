import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { FunctionsHttpError } from '@supabase/supabase-js'
import {
  deleteAccount,
  getSession,
  isRecoverySession,
  markOnboardingSeen,
  onAuthStateChange,
  resetPasswordForEmail,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  updatePassword,
} from './auth'
import { supabase } from './supabaseClient'

function makeJwt(payload: object): string {
  const base64url = (str: string) => btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${base64url('{}')}.${base64url(JSON.stringify(payload))}.sig`
}

vi.mock('./supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    functions: { invoke: vi.fn() },
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
  it('forwards the event name and session from the auth event to the callback', () => {
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

    expect(callback).toHaveBeenCalledWith('SIGNED_IN', session)
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

  it('resolves with the error supabase returns instead of throwing', async () => {
    const error = new Error('network error')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error } as any)

    await expect(signOut()).resolves.toEqual({ error })
  })

  it('wraps a rejection from the underlying call into an { error } result instead of throwing', async () => {
    vi.mocked(supabase.auth.signOut).mockRejectedValue(new Error('network error'))

    await expect(signOut()).resolves.toEqual({ error: new Error('network error') })
  })
})

describe('signUpWithPassword', () => {
  it('delegates to supabase with email and password', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.signUp).mockResolvedValue({ data: {}, error: null } as any)

    await signUpWithPassword('a@b.com', 'pw')

    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' })
  })
})

describe('resetPasswordForEmail', () => {
  it('delegates to supabase with the email and a redirect back to /reset-password', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ data: {}, error: null } as any)

    await resetPasswordForEmail('a@b.com')

    expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('a@b.com', {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  })
})

describe('updatePassword', () => {
  it('delegates to supabase with the new password', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: {}, error: null } as any)

    await updatePassword('newpw')

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpw' })
  })
})

describe('markOnboardingSeen', () => {
  it('sets the has_seen_onboarding user metadata flag', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: {}, error: null } as any)

    await markOnboardingSeen()

    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ data: { has_seen_onboarding: true } })
  })
})

describe('deleteAccount', () => {
  it('invokes the delete-account function', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: { success: true }, error: null } as never)

    await deleteAccount()

    expect(supabase.functions.invoke).toHaveBeenCalledWith('delete-account')
  })

  it('surfaces the Edge Function response message on a FunctionsHttpError', async () => {
    const context = {
      json: () => Promise.resolve({ error: '인증에 실패했습니다.' }),
    } as Response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(context),
    } as never)

    await expect(deleteAccount()).rejects.toThrow('인증에 실패했습니다.')
  })

  it('throws when the function returns a non-HTTP error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('network error'),
    } as never)

    await expect(deleteAccount()).rejects.toThrow('network error')
  })
})

describe('isRecoverySession', () => {
  it('returns true when the session JWT amr claim includes a recovery entry', () => {
    const session = { access_token: makeJwt({ amr: [{ method: 'recovery', timestamp: 1 }] }) } as Session
    expect(isRecoverySession(session)).toBe(true)
  })

  it('returns false when the session JWT amr claim has no recovery entry', () => {
    const session = { access_token: makeJwt({ amr: [{ method: 'password', timestamp: 1 }] }) } as Session
    expect(isRecoverySession(session)).toBe(false)
  })

  it('returns false when there is no session', () => {
    expect(isRecoverySession(null)).toBe(false)
  })

  it('returns false when the access token cannot be decoded', () => {
    const session = { access_token: 'not-a-jwt' } as Session
    expect(isRecoverySession(session)).toBe(false)
  })
})
