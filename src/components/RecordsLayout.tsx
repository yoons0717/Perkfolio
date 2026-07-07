import { NavLink, Outlet } from 'react-router-dom'
import FloatingAddButton from './FloatingAddButton'

export default function RecordsLayout() {
  return (
    <div className="relative min-h-[calc(100vh-57px)]">
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-24 lg:max-w-6xl xl:max-w-[88rem]">
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

      <FloatingAddButton />
    </div>
  )
}
