import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from './Button'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'
import { isAdmin } from '../lib/admin'

export default function NavBar() {
  const { session, isPasswordRecovery } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!session || isPasswordRecovery) return null

  const showAdminLink = isAdmin(session.user.app_metadata)
  const isRecordsActive = location.pathname === '/table' || location.pathname === '/calendar'
  const isDashboardActive = location.pathname === '/dashboard'
  const isMyPageActive = location.pathname === '/mypage'

  async function handleLogout() {
    const { error } = await signOut()
    if (error) {
      console.error(error)
      return
    }
    navigate('/login')
  }

  return (
    <nav className="relative border-b border-line bg-surface px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        <Link to="/table" className="font-display text-lg font-extrabold text-ink">
          Perk<span className="text-blue">Track</span>
        </Link>
        <div className="hidden items-center gap-5 font-display text-sm font-semibold sm:flex">
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
          {showAdminLink && (
            <Link
              to="/admin/feedback"
              className={`transition-colors ${
                location.pathname === '/admin/feedback' ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              관리자
            </Link>
          )}
          <Link
            to="/mypage"
            className={`transition-colors ${isMyPageActive ? 'text-ink' : 'text-muted hover:text-ink'}`}
          >
            마이페이지
          </Link>
          <Button variant="ghost" onClick={handleLogout} className="font-normal text-muted hover:text-ink">
            로그아웃
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
