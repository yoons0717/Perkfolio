import { afterEach, describe, expect, it, vi } from 'vitest'
import { addFeedback, getFeedbackList } from './feedback'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('addFeedback', () => {
  it('inserts the type and content into the feedback table', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ insert } as any)

    await addFeedback({ type: '버그', content: '버튼이 안 눌려요' })

    expect(supabase.from).toHaveBeenCalledWith('feedback')
    expect(insert).toHaveBeenCalledWith({ type: '버그', content: '버튼이 안 눌려요' })
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const insert = vi.fn().mockResolvedValue({ error })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ insert } as any)

    await expect(addFeedback({ type: '건의', content: '다크모드 추가해주세요' })).rejects.toBe(error)
  })
})

describe('getFeedbackList', () => {
  it('returns the feedback list mapped from snake_case rows', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: '1', type: '버그', content: '버튼이 안 눌려요', created_at: '2026-01-02T00:00:00.000Z' }],
      error: null,
    })
    const select = vi.fn().mockReturnValue({ order })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    const result = await getFeedbackList()

    expect(supabase.from).toHaveBeenCalledWith('feedback')
    expect(select).toHaveBeenCalledWith('*')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([
      { id: '1', type: '버그', content: '버튼이 안 눌려요', createdAt: '2026-01-02T00:00:00.000Z' },
    ])
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const order = vi.fn().mockResolvedValue({ data: null, error })
    const select = vi.fn().mockReturnValue({ order })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    await expect(getFeedbackList()).rejects.toBe(error)
  })
})
