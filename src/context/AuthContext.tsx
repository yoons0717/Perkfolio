import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSession, isRecoverySession, onAuthStateChange } from '../lib/auth'

type AuthContextValue = {
  session: Session | null
  loading: boolean
  // True from the moment a password-recovery link is opened until a real
  // sign-in/out happens. A recovery session must never be treated as a
  // normal login (see ProtectedRoute/NavBar), or opening the emailed link
  // alone would grant full access to the app without the password.
  isPasswordRecovery: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // Only catches the one-time PASSWORD_RECOVERY event, so it resets on
  // reload/remount — combined below with isRecoverySession(session), which
  // is derived fresh from the session's own JWT every time and so survives
  // a reload (or the session syncing to another tab) before this event
  // would otherwise have been seen.
  const [recoveryEventSeen, setRecoveryEventSeen] = useState(false)

  useEffect(() => {
    getSession().then((s) => {
      setSession(s)
      setLoading(false)
    })

    return onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryEventSeen(true)
      else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') setRecoveryEventSeen(false)
      setSession(s)
      setLoading(false)
    })
  }, [])

  const isPasswordRecovery = recoveryEventSeen || isRecoverySession(session)

  return (
    <AuthContext.Provider value={{ session, loading, isPasswordRecovery }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
