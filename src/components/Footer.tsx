import { useAuth } from '../context/AuthContext'

export default function Footer() {
  const { session, isPasswordRecovery } = useAuth()

  if (!session || isPasswordRecovery) return null

  return (
    <footer className="hidden border-t border-line bg-surface px-6 py-4 text-center text-sm text-muted sm:block">
      © 2026 PerkTrack
    </footer>
  )
}
