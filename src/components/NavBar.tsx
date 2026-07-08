import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from './Button'
import FeedbackModal from './FeedbackModal'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../lib/auth'
import { isAdmin } from '../lib/admin'

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export default function NavBar() {
  const { session, isPasswordRecovery } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  if (!session || isPasswordRecovery) return null

  const showAdminLink = isAdmin(session.user.email)
  const isRecordsActive = location.pathname === '/table' || location.pathname === '/calendar'
  const isDashboardActive = location.pathname === '/dashboard'

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
          <Button variant="ghost" onClick={() => setIsFeedbackOpen(true)} className="font-normal text-muted hover:text-ink">
            문의하기
          </Button>
          <Button variant="ghost" onClick={handleLogout} className="font-normal text-muted hover:text-ink">
            로그아웃
          </Button>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
          className="flex h-9 w-9 items-center justify-center rounded-lg p-0 text-muted hover:bg-overlay hover:text-ink sm:hidden"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </Button>
      </div>

      {isMenuOpen && (
        <div className="absolute inset-x-0 top-full z-10 flex flex-col gap-1 border-b border-line bg-surface px-4 py-3 font-display text-sm font-semibold sm:hidden">
          <Link
            to="/table"
            className={`rounded-lg px-2 py-2 transition-colors ${isRecordsActive ? 'text-ink' : 'text-muted hover:text-ink'}`}
          >
            체험단 내역
          </Link>
          <Link
            to="/dashboard"
            className={`rounded-lg px-2 py-2 transition-colors ${isDashboardActive ? 'text-ink' : 'text-muted hover:text-ink'}`}
          >
            대시보드
          </Link>
          {showAdminLink && (
            <Link
              to="/admin/feedback"
              className={`rounded-lg px-2 py-2 transition-colors ${
                location.pathname === '/admin/feedback' ? 'text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              관리자
            </Link>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsFeedbackOpen(true)}
            className="rounded-lg px-2 py-2 text-left font-normal text-muted hover:text-ink"
          >
            문의하기
          </Button>
          <div className="flex items-center justify-between px-2 py-1">
            <Button variant="ghost" onClick={handleLogout} className="font-normal text-muted hover:text-ink">
              로그아웃
            </Button>
            <ThemeToggle />
          </div>
        </div>
      )}
      {isFeedbackOpen && <FeedbackModal onClose={() => setIsFeedbackOpen(false)} />}
    </nav>
  )
}
