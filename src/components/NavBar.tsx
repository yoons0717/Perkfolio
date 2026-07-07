import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from './Button'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'

export default function NavBar() {
  const { session, isPasswordRecovery } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!session || isPasswordRecovery) return null

  const isRecordsActive = location.pathname === '/table' || location.pathname === '/calendar'
  const isDashboardActive = location.pathname === '/dashboard'

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
      <Link to="/table" className="font-display text-lg font-extrabold text-ink">
        PerkTrack
      </Link>
      <div className="flex items-center gap-5 font-display text-sm font-semibold">
        <Link
          to="/table"
          className={`transition-colors ${isRecordsActive ? 'text-ink' : 'text-muted hover:text-ink'}`}
        >
          체험단 내역
        </Link>
        <Link
          to="/dashboard"
          className={`transition-colors ${isDashboardActive ? 'text-ink' : 'text-muted hover:text-ink'}`}
        >
          대시보드
        </Link>
        <Button variant="ghost" onClick={handleLogout} className="font-normal text-muted hover:text-ink">
          로그아웃
        </Button>
        <ThemeToggle />
      </div>
    </nav>
  )
}
