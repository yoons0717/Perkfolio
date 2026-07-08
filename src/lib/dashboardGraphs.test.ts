import { afterEach, describe, expect, it, vi } from 'vitest'
import { addDashboardGraph, deleteDashboardGraph, getDashboardGraphs } from './dashboardGraphs'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('addDashboardGraph', () => {
  it('inserts the axis, chartType, and scope and returns the mapped row', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: '1',
        axis: 'category',
        chart_type: 'bar',
        scope: 'all',
        created_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ insert } as any)

    const result = await addDashboardGraph({ axis: 'category', chartType: 'bar', scope: 'all' })

    expect(supabase.from).toHaveBeenCalledWith('dashboard_graphs')
    expect(insert).toHaveBeenCalledWith({ axis: 'category', chart_type: 'bar', scope: 'all' })
    expect(result).toEqual({
      id: '1',
      axis: 'category',
      chartType: 'bar',
      scope: 'all',
      createdAt: '2026-01-02T00:00:00.000Z',
    })
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const single = vi.fn().mockResolvedValue({ data: null, error })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ insert } as any)

    await expect(addDashboardGraph({ axis: 'month', chartType: 'line', scope: 'all' })).rejects.toBe(error)
  })
})

describe('getDashboardGraphs', () => {
  it('returns the graph list mapped from snake_case rows', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          axis: 'platform',
          chart_type: 'bar',
          scope: 'period',
          created_at: '2026-01-02T00:00:00.000Z',
        },
      ],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ order })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    const result = await getDashboardGraphs()

    expect(supabase.from).toHaveBeenCalledWith('dashboard_graphs')
    expect(select).toHaveBeenCalledWith('*')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([
      { id: '1', axis: 'platform', chartType: 'bar', scope: 'period', createdAt: '2026-01-02T00:00:00.000Z' },
    ])
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const order = vi.fn().mockResolvedValue({ data: null, error })
    const select = vi.fn().mockReturnValue({ order })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    await expect(getDashboardGraphs()).rejects.toBe(error)
  })
})

describe('deleteDashboardGraph', () => {
  it('deletes the row matching the given id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as any)

    await deleteDashboardGraph('1')

    expect(supabase.from).toHaveBeenCalledWith('dashboard_graphs')
    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', '1')
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const eq = vi.fn().mockResolvedValue({ error })
    const del = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as any)

    await expect(deleteDashboardGraph('1')).rejects.toBe(error)
  })
})
