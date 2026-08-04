import { decodeHtmlText, truncate } from './common.ts'
import type { CampaignInfo } from './common.ts'

function extractStoreName(html: string): string | null {
  const match = html.match(/<meta property='og:title' content='([^']*)'/)
  if (!match) return null
  let name = decodeHtmlText(match[1])
  name = name.replace(/^강남맛집\s*/, '')
  name = name.replace(/\[[^\]]*\]/g, '').trim()
  const dashIdx = name.indexOf(' - ')
  if (dashIdx !== -1) name = name.slice(0, dashIdx)
  return name.trim() || null
}

function extractSponsoredItems(html: string): string | null {
  const match = html.match(/<meta property='og:description' content='([^']*)'/)
  if (!match) return null
  const raw = match[1].split(/<br\s*\/?>/i)[0]
  return truncate(decodeHtmlText(raw))
}

function extractReviewDeadline(html: string): string | null {
  const match = html.match(/<dt>리뷰 등록기간<\/dt>\s*<dd>\s*[\d.]+\s*~\s*(\d{2})\.(\d{2})\s*<\/dd>/)
  if (!match) return null
  const [, mm, dd] = match
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let year = today.getFullYear()
  const candidate = new Date(year, Number(mm) - 1, Number(dd))
  if (candidate.getTime() < todayMidnight.getTime()) {
    year += 1
  }
  return `${year}-${mm}-${dd}`
}

function extractReservationNote(html: string): string | null {
  const guideMatch = html.match(/<dd id="cmp_guide"[^>]*>([\s\S]*?)<\/dd>/)
  if (!guideMatch) return null
  const paragraphs = [...guideMatch[1].matchAll(/<p>([\s\S]*?)<\/p>/g)]
    .map((m) => decodeHtmlText(m[1]))
    .filter((text) => text.length > 0 && (text.includes('예약') || text.includes('체험가능시간')))
  if (paragraphs.length === 0) return null
  return truncate(paragraphs.join(' '))
}

export function parse(html: string): CampaignInfo {
  return {
    platform: '강남맛집',
    storeName: extractStoreName(html),
    sponsoredItems: extractSponsoredItems(html),
    reviewDeadline: extractReviewDeadline(html),
    reservationNote: extractReservationNote(html),
  }
}
