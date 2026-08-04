import { assertEquals } from 'jsr:@std/assert'
import { parse } from './gangnammatzip.ts'

function expectedReviewDeadline(month: number, day: number): string {
  const today = new Date()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let year = today.getFullYear()
  const candidate = new Date(year, month - 1, day)
  if (candidate.getTime() < todayMidnight.getTime()) year += 1
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

Deno.test('parses all fields from the gangnammatzip fixture', async () => {
  const html = await Deno.readTextFile(
    new URL('./fixtures/gangnammatzip-sample.html', import.meta.url),
  )
  const info = parse(html)

  assertEquals(info.platform, '강남맛집')
  assertEquals(info.storeName, 'OPNNG')
  assertEquals(info.sponsoredItems, '총 8코스 제공 체험권(2인기준, 61만원상당)')
  assertEquals(info.reviewDeadline, expectedReviewDeadline(8, 26))
  assertEquals(
    info.reservationNote,
    '★ 체험가능시간 18:00~19:30 ★ 반드시 방문 2~3일 전 미리 예약해주셔야 체험진행이 가능합니다',
  )
})

Deno.test('uses the dynamic single-quoted og:title, not the static double-quoted default', async () => {
  const html = await Deno.readTextFile(
    new URL('./fixtures/gangnammatzip-sample.html', import.meta.url),
  )
  const info = parse(html)
  assertEquals(info.storeName, 'OPNNG')
})

Deno.test('returns nulls when expected markup is missing', () => {
  const info = parse('<html><body>아무 정보 없음</body></html>')
  assertEquals(info.platform, '강남맛집')
  assertEquals(info.storeName, null)
  assertEquals(info.sponsoredItems, null)
  assertEquals(info.reviewDeadline, null)
  assertEquals(info.reservationNote, null)
})
