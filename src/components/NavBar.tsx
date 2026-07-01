import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

const links = [
  { to: '/add', label: '입력' },
  { to: '/table', label: '표' },
  { to: '/calendar', label: '캘린더' },
  { to: '/dashboard', label: '대시보드' },
]

export default function NavBar() {
  const { session } = useAuth()
  const navigate = useNavigate()

  if (!session) return null

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <nav className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
      <span className="font-display text-lg font-extrabold text-ink">Perkfolio</span>
      <div className="flex items-center gap-5 font-display text-sm font-semibold">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'text-ink' : 'text-muted')}
          >
            {link.label}
          </NavLink>
        ))}
        <button type="button" onClick={handleLogout} className="text-sm font-normal text-muted">
          로그아웃
        </button>
      </div>
    </nav>
  )
}
