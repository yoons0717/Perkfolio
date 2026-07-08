import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildNaverAuthorizeUrl, exchangeNaverCode, completeNaverSignIn } from './naverAuth'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    auth: { verifyOtp: vi.fn() },
  },
}))

afterEach(() => vi.clearAllMocks())

describe('buildNaverAuthorizeUrl', () => {
  it('includes client_id, redirect_uri, state', () => {
    const url = buildNaverAuthorizeUrl('abc123')
    expect(url).toContain('state=abc123')
    expect(url).toContain('response_type=code')
    expect(url).toContain(encodeURIComponent('/auth/naver/callback'))
  })
})

describe('exchangeNaverCode', () => {
  it('invokes the naver-auth function and returns data', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { email: 'a@b.com', token: 'tok' },
      error: null,
    } as never)
    const result = await exchangeNaverCode('code1', 'state1')
    expect(supabase.functions.invoke).toHaveBeenCalledWith('naver-auth', {
      body: { code: 'code1', state: 'state1' },
    })
    expect(result).toEqual({ email: 'a@b.com', token: 'tok' })
  })

  it('throws when the function returns an error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('boom'),
    } as never)
    await expect(exchangeNaverCode('c', 's')).rejects.toThrow('boom')
  })
})

describe('completeNaverSignIn', () => {
  it('calls verifyOtp with magiclink type', () => {
    completeNaverSignIn('a@b.com', 'tok')
    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      email: 'a@b.com',
      token: 'tok',
      type: 'magiclink',
    })
  })
})
