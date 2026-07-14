import { useLocation } from 'react-router-dom'

export function useActiveNav() {
  const location = useLocation()

  return {
    isRecordsActive: location.pathname === '/table' || location.pathname === '/calendar',
    isDashboardActive: location.pathname === '/dashboard',
    isMyPageActive: location.pathname === '/mypage',
  }
}
