import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useBodyScrollLock } from './useBodyScrollLock'

afterEach(() => {
  document.body.style.overflow = ''
})

describe('useBodyScrollLock', () => {
  it('locks body scroll while mounted and restores it on unmount', () => {
    const { unmount } = renderHook(() => useBodyScrollLock())

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('')
  })

  it('restores the previous overflow value instead of always clearing it', () => {
    document.body.style.overflow = 'scroll'
    const { unmount } = renderHook(() => useBodyScrollLock())

    unmount()

    expect(document.body.style.overflow).toBe('scroll')
  })
})
