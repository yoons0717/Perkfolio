import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useVisitActions } from './useVisitActions'
import { toggleStatus } from '../lib/visits'
import { makeVisit } from '../test/factories'
import type { Visit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  toggleStatus: vi.fn(),
  deleteVisit: vi.fn(),
}))

const visit: Visit = makeVisit({ visitDate: '2026-01-01' })

const fakeMouseEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent

function otherVisit(id: string): Visit {
  return { ...visit, id }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('handleToggleStatus', () => {
  it('replaces the matching visit with the updated one on success', async () => {
    const updated = { ...visit, status: '방문완료' as const }
    vi.mocked(toggleStatus).mockResolvedValue(updated)
    const setVisits = vi.fn()
    const { result } = renderHook(() => useVisitActions(setVisits))

    await act(async () => {
      await result.current.handleToggleStatus(fakeMouseEvent, visit)
    })

    expect(toggleStatus).toHaveBeenCalledWith('1', '예정')
    const updater = setVisits.mock.calls[0][0] as (prev: Visit[]) => Visit[]
    expect(updater([visit, otherVisit('2')])).toEqual([updated, otherVisit('2')])
    expect(result.current.actionError).toBeNull()
    // the row itself is also click-navigable, so the badge click must not bubble up to it
    expect(fakeMouseEvent.stopPropagation).toHaveBeenCalledTimes(1)
  })

  it('sets actionError and does not update visits on failure', async () => {
    vi.mocked(toggleStatus).mockRejectedValue(new Error('network error'))
    const setVisits = vi.fn()
    const { result } = renderHook(() => useVisitActions(setVisits))

    await act(async () => {
      await result.current.handleToggleStatus(fakeMouseEvent, visit)
    })

    expect(setVisits).not.toHaveBeenCalled()
    expect(result.current.actionError).toBe('상태 변경에 실패했습니다.')
    expect(fakeMouseEvent.stopPropagation).toHaveBeenCalledTimes(1)
  })
})
