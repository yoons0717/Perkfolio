import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useIsMobile } from './useIsMobile'

function mockMatchMedia(initialMatches: boolean) {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  const mql = {
    matches: initialMatches,
    addEventListener: (_event: string, cb: (e: MediaQueryListEvent) => void) => listeners.push(cb),
    removeEventListener: vi.fn(),
  }
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia
  return {
    trigger(matches: boolean) {
      mql.matches = matches
      listeners.forEach((cb) => cb({ matches } as MediaQueryListEvent))
    },
  }
}

describe('useIsMobile', () => {
  it('returns the initial match state from matchMedia', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('updates when the media query match state changes', () => {
    const { trigger } = mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => trigger(true))
    expect(result.current).toBe(true)
  })
})
