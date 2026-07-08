import { describe, it, expect, vi, afterEach } from 'vitest'
import { FunctionsHttpError } from '@supabase/supabase-js'
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

  it('surfaces the Edge Function response message on a FunctionsHttpError', async () => {
    const context = {
      json: () => Promise.resolve({ error: '먼저 이메일 인증을 완료해주세요.' }),
    } as Response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(context),
    } as never)
    await expect(exchangeNaverCode('c', 's')).rejects.toThrow('먼저 이메일 인증을 완료해주세요.')
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
