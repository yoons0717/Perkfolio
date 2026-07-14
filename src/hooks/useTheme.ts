import { useEffect, useState } from 'react'
import { getStoredTheme, setStoredTheme } from '../lib/theme'
import type { Theme } from '../lib/theme'

// Multiple components can call useTheme() at once (e.g. NavBar's ThemeToggle
// stays mounted while MyPage's own theme row is also on screen). Each call
// used to seed its own local state from localStorage only once at mount, so
// toggling from one instance left every other mounted instance stale until
// it happened to re-render for an unrelated reason. This module-level set
// lets toggleTheme notify every mounted instance, not just its own.
const listeners = new Set<(theme: Theme) => void>()

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  useEffect(() => {
    listeners.add(setTheme)
    return () => {
      listeners.delete(setTheme)
    }
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setStoredTheme(next)
    listeners.forEach((listener) => listener(next))
  }

  return { theme, toggleTheme }
}
