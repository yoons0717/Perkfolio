import { describe, it, expect, vi, afterEach } from 'vitest'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { detectSupportedPlatform, fetchCampaignInfo } from './campaignInfo'
import { supabase } from './supabaseClient'

vi.mock('./supabaseClient', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
  },
}))

afterEach(() => vi.clearAllMocks())

describe('detectSupportedPlatform', () => {
  it('recognizes dinnerqueen.net as 디너의여왕', () => {
    expect(detectSupportedPlatform('https://dinnerqueen.net/taste/1477357')).toBe('디너의여왕')
  })

  it('recognizes the gangnammatzip punycode hostname as 강남맛집', () => {
    expect(detectSupportedPlatform('https://xn--939au0g4vj8sq.net/cp/?id=2252070')).toBe(
      '강남맛집',
    )
  })

  it('recognizes the Korean gangnammatzip domain (normalized to punycode by URL)', () => {
    expect(detectSupportedPlatform('https://강남맛집.net/cp/?id=2252070')).toBe('강남맛집')
  })

  it('returns null for an unsupported domain', () => {
    expect(detectSupportedPlatform('https://revu.net/campaigns/1')).toBeNull()
  })

  it('returns null for a hostname suffix bypass attempt', () => {
    expect(detectSupportedPlatform('https://dinnerqueen.net.evil.com/x')).toBeNull()
  })

  it('returns null for a string that is not a URL', () => {
    expect(detectSupportedPlatform('not a url')).toBeNull()
  })

  it('trims surrounding whitespace before parsing', () => {
    expect(detectSupportedPlatform('  https://dinnerqueen.net/taste/1  ')).toBe('디너의여왕')
  })
})

describe('fetchCampaignInfo', () => {
  it('invokes the fetch-campaign-info function and returns data', async () => {
    const info = {
      platform: '디너의여왕' as const,
      storeName: '최가네샤브버섯칼국수',
      sponsoredItems: '스페셜샤브샤브 2인',
      reviewDeadline: '2026-08-19',
      reservationNote: '예약 필수',
    }
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: info, error: null } as never)

    const result = await fetchCampaignInfo('https://dinnerqueen.net/taste/1477357')

    expect(supabase.functions.invoke).toHaveBeenCalledWith('fetch-campaign-info', {
      body: { url: 'https://dinnerqueen.net/taste/1477357' },
    })
    expect(result).toEqual(info)
  })

  it('throws when the function returns a generic error', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('boom'),
    } as never)
    await expect(fetchCampaignInfo('https://dinnerqueen.net/taste/1')).rejects.toThrow('boom')
  })

  it('surfaces the Edge Function response message on a FunctionsHttpError', async () => {
    const context = {
      json: () => Promise.resolve({ error: '지원하지 않는 사이트예요. 직접 입력해주세요.' }),
    } as Response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(context),
    } as never)
    await expect(fetchCampaignInfo('https://revu.net/campaigns/1')).rejects.toThrow(
      '지원하지 않는 사이트예요. 직접 입력해주세요.',
    )
  })

  it('falls back to a generic message when the FunctionsHttpError body has no error field', async () => {
    const context = { json: () => Promise.resolve({}) } as Response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new FunctionsHttpError(context),
    } as never)
    await expect(fetchCampaignInfo('https://dinnerqueen.net/taste/1')).rejects.toThrow(
      '정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.',
    )
  })

  it('throws a generic message when the response data is missing or malformed', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: undefined, error: null } as never)
    await expect(fetchCampaignInfo('https://dinnerqueen.net/taste/1')).rejects.toThrow(
      '정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.',
    )
  })
})
