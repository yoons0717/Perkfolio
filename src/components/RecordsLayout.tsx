import { Link, NavLink, Outlet } from 'react-router-dom'

export default function RecordsLayout() {
  return (
    <div className="relative min-h-[calc(100vh-57px)]">
      <div className="mx-auto max-w-3xl px-4 pt-6 lg:max-w-5xl">
        <div className="mb-6 flex justify-center">
          <div className="flex rounded-full border border-line bg-surface p-1 text-sm font-semibold">
            <NavLink
              to="/table"
              className={({ isActive }) =>
                `rounded-full px-5 py-2 ${isActive ? 'bg-blue text-white' : 'text-muted'}`
              }
            >
              표
            </NavLink>
            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                `rounded-full px-5 py-2 ${isActive ? 'bg-blue text-white' : 'text-muted'}`
              }
            >
              캘린더
            </NavLink>
          </div>
        </div>

        <Outlet />
      </div>

      <Link
        to="/add"
        className="fixed bottom-7 right-7 flex h-14 w-14 items-center justify-center rounded-full bg-blue text-2xl text-white shadow-lg shadow-blue/40"
        aria-label="방문 추가"
      >
        +
      </Link>
    </div>
  )
}
