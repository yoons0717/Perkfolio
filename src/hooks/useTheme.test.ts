import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useTheme } from './useTheme'

afterEach(() => {
  localStorage.clear()
  document.documentElement.dataset.theme = ''
})

describe('useTheme', () => {
  it('reads the stored theme on mount', () => {
    localStorage.setItem('perktrack-theme', 'light')
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('light')
  })

  it('defaults to dark when nothing is stored', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe('dark')
  })

  it('toggling in one instance also updates every other mounted instance', () => {
    // Simulates NavBar's <ThemeToggle/> (always mounted) and MyPage's own
    // theme row both calling useTheme() at the same time.
    const a = renderHook(() => useTheme())
    const b = renderHook(() => useTheme())

    expect(a.result.current.theme).toBe('dark')
    expect(b.result.current.theme).toBe('dark')

    act(() => {
      a.result.current.toggleTheme()
    })

    expect(a.result.current.theme).toBe('light')
    expect(b.result.current.theme).toBe('light')
  })

  it('an unmounted instance is not notified after it unmounts', () => {
    const a = renderHook(() => useTheme())
    const b = renderHook(() => useTheme())
    b.unmount()

    act(() => {
      a.result.current.toggleTheme()
    })

    expect(a.result.current.theme).toBe('light')
    expect(localStorage.getItem('perktrack-theme')).toBe('light')
  })
})
