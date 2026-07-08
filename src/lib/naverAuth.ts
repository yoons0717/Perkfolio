import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

const NAVER_AUTHORIZE_URL = 'https://nid.naver.com/oauth2.0/authorize'

export function buildNaverAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: import.meta.env.VITE_NAVER_CLIENT_ID,
    redirect_uri: `${window.location.origin}/auth/naver/callback`,
    state,
  })
  return `${NAVER_AUTHORIZE_URL}?${params.toString()}`
}

export async function exchangeNaverCode(
  code: string,
  state: string,
): Promise<{ email: string; token: string }> {
  const { data, error } = await supabase.functions.invoke('naver-auth', {
    body: { code, state },
  })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      throw new Error(body?.error ?? '로그인에 실패했습니다. 다시 시도해주세요.')
    }
    throw error
  }
  return data
}

export function completeNaverSignIn(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: 'magiclink' })
}
