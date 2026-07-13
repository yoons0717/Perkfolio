import { afterEach, describe, expect, it, vi } from 'vitest'
import { deleteProfile, getProfile, upsertProfile } from './profiles'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('getProfile', () => {
  it('returns the profile mapped from a snake_case row', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        user_id: 'user-1',
        blog_url: 'https://blog.naver.com/yeonis',
        blog_name: '여니의 체험단 일기',
        blog_description: '맛집 후기 블로그',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    const result = await getProfile('user-1')

    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(select).toHaveBeenCalledWith('*')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(result).toEqual({
      userId: 'user-1',
      blogUrl: 'https://blog.naver.com/yeonis',
      blogName: '여니의 체험단 일기',
      blogDescription: '맛집 후기 블로그',
      updatedAt: '2026-01-02T00:00:00.000Z',
    })
  })

  it('returns null when no profile row exists', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    const result = await getProfile('user-1')

    expect(result).toBeNull()
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ select } as any)

    await expect(getProfile('user-1')).rejects.toBe(error)
  })
})

describe('upsertProfile', () => {
  it('upserts the row keyed on user_id and returns the saved profile', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        user_id: 'user-1',
        blog_url: 'https://blog.naver.com/yeonis',
        blog_name: null,
        blog_description: null,
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      error: null,
    })
    const select = vi.fn().mockReturnValue({ single })
    const upsert = vi.fn().mockReturnValue({ select })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ upsert } as any)

    const result = await upsertProfile('user-1', {
      blogUrl: 'https://blog.naver.com/yeonis',
      blogName: null,
      blogDescription: null,
    })

    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        blog_url: 'https://blog.naver.com/yeonis',
        blog_name: null,
        blog_description: null,
      }),
      { onConflict: 'user_id' },
    )
    expect(result.blogUrl).toBe('https://blog.naver.com/yeonis')
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const single = vi.fn().mockResolvedValue({ data: null, error })
    const select = vi.fn().mockReturnValue({ single })
    const upsert = vi.fn().mockReturnValue({ select })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ upsert } as any)

    await expect(
      upsertProfile('user-1', {
        blogUrl: 'https://blog.naver.com/yeonis',
        blogName: null,
        blogDescription: null,
      }),
    ).rejects.toBe(error)
  })
})

describe('deleteProfile', () => {
  it('deletes the row for the given user id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as any)

    await deleteProfile('user-1')

    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('throws when supabase returns an error', async () => {
    const error = new Error('network error')
    const eq = vi.fn().mockResolvedValue({ error })
    const del = vi.fn().mockReturnValue({ eq })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(supabase.from).mockReturnValue({ delete: del } as any)

    await expect(deleteProfile('user-1')).rejects.toBe(error)
  })
})
