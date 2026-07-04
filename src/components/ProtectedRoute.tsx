import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, isPasswordRecovery } = useAuth()

  if (loading) return null
  if (isPasswordRecovery) return <Navigate to="/reset-password" replace />
  if (!session) return <Navigate to="/login" replace />

  return children
}
