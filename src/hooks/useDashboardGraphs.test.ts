import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDashboardGraphs } from './useDashboardGraphs'
import {
  getDashboardGraphs,
  addDashboardGraph,
  deleteDashboardGraph,
} from '../lib/dashboardGraphs'
import { makeDashboardGraph } from '../test/factories'

vi.mock('../lib/dashboardGraphs', () => ({
  getDashboardGraphs: vi.fn(),
  addDashboardGraph: vi.fn(),
  deleteDashboardGraph: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

const graph1 = makeDashboardGraph({ id: '1', axis: 'category' })
const graph2 = makeDashboardGraph({ id: '2', axis: 'platform' })

describe('useDashboardGraphs', () => {
  it('starts loading, then exposes the fetched graphs', async () => {
    vi.mocked(getDashboardGraphs).mockResolvedValue([graph1, graph2])
    const { result } = renderHook(() => useDashboardGraphs())

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.graphs).toEqual([graph1, graph2])
    expect(result.current.error).toBeNull()
  })

  it('sets an error message when the fetch fails', async () => {
    vi.mocked(getDashboardGraphs).mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useDashboardGraphs())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('그래프 목록을 불러오지 못했습니다.')
    expect(result.current.graphs).toEqual([])
  })

  it('adds a graph to local state after successful add', async () => {
    vi.mocked(getDashboardGraphs).mockResolvedValue([graph1])
    const { result } = renderHook(() => useDashboardGraphs())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.graphs).toEqual([graph1])

    vi.mocked(addDashboardGraph).mockResolvedValue(undefined)
    vi.mocked(getDashboardGraphs).mockResolvedValue([graph1, graph2])

    await result.current.addGraph({
      axis: 'platform',
      chartType: 'line',
      scope: 'period',
    })

    await waitFor(() => expect(result.current.graphs).toEqual([graph1, graph2]))
    expect(addDashboardGraph).toHaveBeenCalledWith({
      axis: 'platform',
      chartType: 'line',
      scope: 'period',
    })
  })

  it('removes a graph from local state after successful delete', async () => {
    vi.mocked(getDashboardGraphs).mockResolvedValue([graph1, graph2])
    const { result } = renderHook(() => useDashboardGraphs())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.graphs).toEqual([graph1, graph2])

    vi.mocked(deleteDashboardGraph).mockResolvedValue(undefined)

    await result.current.removeGraph('1')

    await waitFor(() => expect(result.current.graphs).toEqual([graph2]))
    expect(deleteDashboardGraph).toHaveBeenCalledWith('1')
  })
})
