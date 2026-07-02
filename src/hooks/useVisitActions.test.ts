import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useVisitActions } from './useVisitActions'
import { deleteVisit, toggleStatus } from '../lib/visits'
import type { Visit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  toggleStatus: vi.fn(),
  deleteVisit: vi.fn(),
}))

const visit: Visit = {
  id: '1',
  visitDate: '2026-01-01',
  platform: '포포몬',
  storeName: '카페 온도',
  category: '카페',
  sponsoredItems: '음료 2',
  campaignUrl: 'https://campaign.example.com',
  storeInfoUrl: 'https://store.example.com',
  retailValue: 10000,
  extraPayment: 0,
  status: '예정',
  postUrl: null,
  reviewDeadline: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

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
  })
})

describe('handleDelete', () => {
  it('does nothing when the confirm dialog is dismissed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const setVisits = vi.fn()
    const { result } = renderHook(() => useVisitActions(setVisits))

    await act(async () => {
      await result.current.handleDelete(fakeMouseEvent, visit, '삭제할까요?')
    })

    expect(deleteVisit).not.toHaveBeenCalled()
    expect(setVisits).not.toHaveBeenCalled()
  })

  it('removes the visit on confirmed success', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(deleteVisit).mockResolvedValue(undefined)
    const setVisits = vi.fn()
    const { result } = renderHook(() => useVisitActions(setVisits))

    await act(async () => {
      await result.current.handleDelete(fakeMouseEvent, visit, '삭제할까요?')
    })

    expect(deleteVisit).toHaveBeenCalledWith('1')
    const updater = setVisits.mock.calls[0][0] as (prev: Visit[]) => Visit[]
    expect(updater([visit, otherVisit('2')])).toEqual([otherVisit('2')])
    expect(result.current.actionError).toBeNull()
  })

  it('sets actionError on delete failure', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(deleteVisit).mockRejectedValue(new Error('network error'))
    const setVisits = vi.fn()
    const { result } = renderHook(() => useVisitActions(setVisits))

    await act(async () => {
      await result.current.handleDelete(fakeMouseEvent, visit, '삭제할까요?')
    })

    expect(result.current.actionError).toBe('삭제에 실패했습니다.')
  })
})
