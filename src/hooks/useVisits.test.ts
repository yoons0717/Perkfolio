import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useVisits } from './useVisits'
import { getVisits } from '../lib/visits'
import type { Visit } from '../types/visit'

vi.mock('../lib/visits', () => ({
  getVisits: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

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

describe('useVisits', () => {
  it('starts loading, then exposes the fetched visits', async () => {
    vi.mocked(getVisits).mockResolvedValue([visit])
    const { result } = renderHook(() => useVisits())

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.visits).toEqual([visit])
    expect(result.current.error).toBeNull()
  })

  it('sets an error message when the fetch fails', async () => {
    vi.mocked(getVisits).mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useVisits())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('목록을 불러오지 못했습니다.')
    expect(result.current.visits).toEqual([])
  })

  it('exposes setVisits so callers can update the list locally', async () => {
    vi.mocked(getVisits).mockResolvedValue([visit])
    const { result } = renderHook(() => useVisits())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setVisits((prev) => prev.filter((v) => v.id !== '1'))
    })

    expect(result.current.visits).toEqual([])
  })
})
