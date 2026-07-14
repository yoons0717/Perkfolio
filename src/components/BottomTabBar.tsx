import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function TableIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-5 4 3 5-7" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  )
}

export default function BottomTabBar() {
  const { session, isPasswordRecovery } = useAuth()
  const location = useLocation()

  if (!session || isPasswordRecovery) return null

  const items = [
    {
      to: '/table',
      label: '체험단내역',
      active: location.pathname === '/table' || location.pathname === '/calendar',
      Icon: TableIcon,
    },
    { to: '/dashboard', label: '대시보드', active: location.pathname === '/dashboard', Icon: ChartIcon },
    { to: '/mypage', label: '마이페이지', active: location.pathname === '/mypage', Icon: UserIcon },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface sm:hidden">
      {items.map(({ to, label, active, Icon }) => (
        <Link
          key={to}
          to={to}
          className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 font-display text-[10.5px] font-semibold transition-colors ${
            active ? 'text-blue' : 'text-muted'
          }`}
        >
          <Icon />
          {label}
        </Link>
      ))}
    </nav>
  )
}
