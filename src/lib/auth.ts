import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session))
  return () => data.subscription.unsubscribe()
}

export function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function signUpWithPassword(email: string, password: string) {
  return supabase.auth.signUp({ email, password })
}

export function resetPasswordForEmail(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export function updatePassword(password: string) {
  return supabase.auth.updateUser({ password })
}

export function markOnboardingSeen() {
  return supabase.auth.updateUser({ data: { has_seen_onboarding: true } })
}

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  try {
    const base64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

// Derived straight from the session's JWT rather than tracked via the
// one-time PASSWORD_RECOVERY auth event, so it's still correct after a page
// reload or in another tab where the session was synced but that event was
// never seen (the event alone would silently reset to "not recovery").
export function isRecoverySession(session: Session | null): boolean {
  if (!session?.access_token) return false
  const amr = decodeJwtPayload(session.access_token)?.amr as Array<{ method?: string } | string> | undefined
  if (!Array.isArray(amr)) return false
  return amr.some((entry) => (typeof entry === 'string' ? entry : entry?.method) === 'recovery')
}
