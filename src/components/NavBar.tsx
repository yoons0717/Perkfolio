import { NavLink } from 'react-router-dom'

const links = [
  { to: '/add', label: '입력' },
  { to: '/table', label: '표' },
  { to: '/calendar', label: '캘린더' },
  { to: '/dashboard', label: '대시보드' },
]

export default function NavBar() {
  return (
    <nav className="flex gap-4 border-b border-gray-200 px-6 py-3">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            isActive ? 'font-semibold text-black' : 'text-gray-500'
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}
