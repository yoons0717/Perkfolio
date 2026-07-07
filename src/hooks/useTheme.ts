import { useState } from 'react'
import { getStoredTheme, setStoredTheme } from '../lib/theme'
import type { Theme } from '../lib/theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setStoredTheme(next)
    setTheme(next)
  }

  return { theme, toggleTheme }
}
