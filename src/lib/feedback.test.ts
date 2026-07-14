import { afterEach, describe, expect, it, vi } from 'vitest'
import { addFeedback, deleteFeedback, getFeedbackList, getMyFeedbackList, replyToFeedback } from './feedback'
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
  it('inserts the type, content, and submitter email into the feedback table', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ insert } as any)

    await addFeedback({ type: '버그', content: '버튼이 안 눌려요', userEmail: 'user@example.com' })

    expect(supabase.from).toHaveBeenCalledWith('feedback')
    expect(insert).toHaveBeenCalledWith({
      type: '버그',
      content: '버튼이 안 눌려요',
      user_email: 'user@example.com',
    })
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const insert = vi.fn().mockResolvedValue({ error })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ insert } as any)

    await expect(
      addFeedback({ type: '건의', content: '다크모드 추가해주세요', userEmail: 'user@example.com' }),
    ).rejects.toBe(error)
  })
})

describe('getFeedbackList', () => {
  it('returns the feedback list mapped from snake_case rows, including reply fields', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          type: '버그',
          content: '버튼이 안 눌려요',
          created_at: '2026-01-02T00:00:00.000Z',
          user_email: 'user@example.com',
          admin_reply: '확인해서 수정했어요',
          replied_at: '2026-01-03T00:00:00.000Z',
        },
      ],
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
      {
        id: '1',
        type: '버그',
        content: '버튼이 안 눌려요',
        createdAt: '2026-01-02T00:00:00.000Z',
        userEmail: 'user@example.com',
        adminReply: '확인해서 수정했어요',
        repliedAt: '2026-01-03T00:00:00.000Z',
      },
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

describe('getMyFeedbackList', () => {
  it('filters the feedback table by user_id so it never returns another user\'s rows', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          type: '건의',
          content: '다크모드 추가해주세요',
          created_at: '2026-01-02T00:00:00.000Z',
          user_email: 'user@example.com',
          admin_reply: null,
          replied_at: null,
        },
      ],
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    const result = await getMyFeedbackList('user-1')

    expect(supabase.from).toHaveBeenCalledWith('feedback')
    expect(select).toHaveBeenCalledWith('*')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(result).toEqual([
      {
        id: '1',
        type: '건의',
        content: '다크모드 추가해주세요',
        createdAt: '2026-01-02T00:00:00.000Z',
        userEmail: 'user@example.com',
        adminReply: null,
        repliedAt: null,
      },
    ])
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const order = vi.fn().mockResolvedValue({ data: null, error })
    const eq = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    await expect(getMyFeedbackList('user-1')).rejects.toBe(error)
  })
})

describe('replyToFeedback', () => {
  it('updates the admin_reply and replied_at columns for the given feedback id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ update } as any)

    await replyToFeedback('1', '확인해서 수정했어요')

    expect(supabase.from).toHaveBeenCalledWith('feedback')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ admin_reply: '확인해서 수정했어요' }),
    )
    expect(eq).toHaveBeenCalledWith('id', '1')
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const eq = vi.fn().mockResolvedValue({ error })
    const update = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ update } as any)

    await expect(replyToFeedback('1', '답변')).rejects.toBe(error)
  })
})

describe('deleteFeedback', () => {
  it('deletes the feedback row by id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as any)

    await deleteFeedback('1')

    expect(supabase.from).toHaveBeenCalledWith('feedback')
    expect(del).toHaveBeenCalled()
    expect(eq).toHaveBeenCalledWith('id', '1')
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const eq = vi.fn().mockResolvedValue({ error })
    const del = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as any)

    await expect(deleteFeedback('1')).rejects.toBe(error)
  })
})
