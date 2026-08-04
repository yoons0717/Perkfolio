import { decodeHtmlText, truncate } from './common.ts'
import type { CampaignInfo } from './common.ts'

function extractStoreName(html: string): string | null {
  const match = html.match(/<meta property="og:title" content="([^"]*)"/)
  if (!match) return null
  let name = decodeHtmlText(match[1])
  const dashIdx = name.indexOf(' - ')
  if (dashIdx !== -1) name = name.slice(dashIdx + 3)
  name = name.replace(/\[[^\]]*\]/g, '').trim()
  name = name.replace(/\s*\d+차\s*$/, '').trim()
  return name || null
}

function extractSponsoredItems(html: string): string | null {
  const match = html.match(/<strong class="w-600">([^<]*)<\/strong>/)
  if (!match) return null
  return truncate(decodeHtmlText(match[1]))
}

// "신청 기간"/"발표 날짜"/"리뷰 기간" 라벨 3개 다음에 값 3개가 순서대로 오는 구조라
// 인라인으로 못 뽑는다. "리뷰 기간" 뒤 700자 안에서 날짜-범위 패턴을 전부 찾아 마지막
// 매치(=3번째 값)를 취한다. 연도는 항상 2자리(예: "26" = 2026).
function extractReviewDeadline(html: string): string | null {
  const labelIdx = html.indexOf('리뷰 기간')
  if (labelIdx === -1) return null
  const windowText = html.slice(labelIdx, labelIdx + 700)
  const matches = [...windowText.matchAll(/(\d{2})\.(\d{2})\.(\d{2})\s*[–-]\s*(\d{2})\.(\d{2})\.(\d{2})/g)]
  if (matches.length === 0) return null
  const last = matches[matches.length - 1]
  const [, , , , endYY, endMM, endDD] = last
  return `20${endYY}-${endMM}-${endDD}`
}

// 페이지에 white-pre-l 스팬이 3개 있는데("체험 시간", "휴무일", 실제 예약 안내) 실제
// 예약 안내만 "예약" 단어를 포함해서 이걸로 구분한다.
function extractReservationNote(html: string): string | null {
  const spans = [...html.matchAll(/<span class="white-pre-l">([\s\S]*?)<\/span>/g)]
  const target = spans.find((m) => m[1].includes('예약'))
  if (!target) return null
  return truncate(decodeHtmlText(target[1]))
}

export function parse(html: string): CampaignInfo {
  return {
    platform: '디너의여왕',
    storeName: extractStoreName(html),
    sponsoredItems: extractSponsoredItems(html),
    reviewDeadline: extractReviewDeadline(html),
    reservationNote: extractReservationNote(html),
  }
}
