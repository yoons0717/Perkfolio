import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAsyncList } from './useAsyncList'

afterEach(() => {
  vi.clearAllMocks()
})

describe('useAsyncList', () => {
  it('starts loading, then exposes the fetched list', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a', 'b'])
    const { result } = renderHook(() => useAsyncList(fetcher, []))

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toEqual(['a', 'b'])
    expect(result.current.error).toBeNull()
  })

  it('sets an error message when the fetch fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useAsyncList(fetcher, [], { errorMessage: '실패했습니다.' }))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('실패했습니다.')
    expect(result.current.data).toEqual([])
  })

  it('uses a default error message when none is given', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useAsyncList(fetcher, []))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('목록을 불러오지 못했습니다.')
  })

  it('skips fetching and reports not-loading when enabled is false', async () => {
    const fetcher = vi.fn()
    const { result } = renderHook(() => useAsyncList(fetcher, [], { enabled: false }))

    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual([])
  })

  it('does not update state after unmount', async () => {
    let resolveFetch: (value: string[]) => void = () => {}
    const fetcher = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve
      }),
    )
    const { unmount } = renderHook(() => useAsyncList(fetcher, []))

    unmount()
    resolveFetch(['a'])

    await new Promise((resolve) => setTimeout(resolve, 0))
  })

  it('exposes a setter so callers can apply optimistic local updates', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a'])
    const { result } = renderHook(() => useAsyncList(fetcher, []))

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setData((list) => [...list, 'b'])
    })

    expect(result.current.data).toEqual(['a', 'b'])
  })
})
