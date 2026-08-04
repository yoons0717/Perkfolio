export type Platform = '디너의여왕' | '강남맛집'

export type CampaignInfo = {
  platform: Platform
  storeName: string | null
  sponsoredItems: string | null
  reviewDeadline: string | null
  reservationNote: string | null
}

const MAX_FIELD_LENGTH = 300

export function decodeHtmlText(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function truncate(value: string): string {
  return value.length > MAX_FIELD_LENGTH ? value.slice(0, MAX_FIELD_LENGTH).trim() : value
}
