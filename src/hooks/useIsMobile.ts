import { useEffect, useState } from 'react'

// Matches Tailwind's `sm` breakpoint (640px), used elsewhere in the app to
// switch between mobile and desktop layouts.
const MOBILE_QUERY = '(max-width: 639px)'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches)

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
