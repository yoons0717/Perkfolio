import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'

export default function NavBar() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!session) return null

  const isRecordsActive = location.pathname === '/table' || location.pathname === '/calendar'
  const isDashboardActive = location.pathname === '/dashboard'

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
      <span className="font-display text-lg font-extrabold text-ink">Perkfolio</span>
      <div className="flex items-center gap-5 font-display text-sm font-semibold">
        <Link to="/table" className={isRecordsActive ? 'text-ink' : 'text-muted'}>
          기록
        </Link>
        <Link to="/dashboard" className={isDashboardActive ? 'text-ink' : 'text-muted'}>
          대시보드
        </Link>
        <button type="button" onClick={handleLogout} className="text-sm font-normal text-muted">
          로그아웃
        </button>
      </div>
    </nav>
  )
}
