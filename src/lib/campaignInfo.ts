import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import type { Platform } from '../types/visit'

export type CampaignInfo = {
  platform: Platform
  storeName: string | null
  sponsoredItems: string | null
  reviewDeadline: string | null
  reservationNote: string | null
}

const SUPPORTED_HOSTNAMES: Record<string, Platform> = {
  'dinnerqueen.net': '디너의여왕',
  'www.dinnerqueen.net': '디너의여왕',
  'xn--939au0g4vj8sq.net': '강남맛집',
}

export function detectSupportedPlatform(url: string): Platform | null {
  let hostname: string
  try {
    hostname = new URL(url.trim()).hostname
  } catch {
    return null
  }
  return SUPPORTED_HOSTNAMES[hostname] ?? null
}

export async function fetchCampaignInfo(url: string): Promise<CampaignInfo> {
  const { data, error } = await supabase.functions.invoke('fetch-campaign-info', {
    body: { url },
  })
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      throw new Error(body?.error ?? '정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.')
    }
    throw error
  }
  return data
}
