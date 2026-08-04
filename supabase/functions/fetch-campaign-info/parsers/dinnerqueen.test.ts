import { assertEquals } from 'jsr:@std/assert'
import { parse } from './dinnerqueen.ts'

Deno.test('parses all fields from the dinnerqueen fixture', async () => {
  const html = await Deno.readTextFile(
    new URL('./fixtures/dinnerqueen-sample.html', import.meta.url),
  )
  const info = parse(html)

  assertEquals(info.platform, '디너의여왕')
  assertEquals(info.storeName, '최가네샤브버섯칼국수')
  assertEquals(info.sponsoredItems, '스페셜샤브샤브 2인 + 국수사리 + 볶음밥 + 355ml 음료 1개')
  assertEquals(info.reviewDeadline, '2026-08-19')
  assertEquals(
    info.reservationNote,
    '★예약 주소 링크 https://naver.me/5WHxA5au >>네이버 예약시, 최소 인원이 5명으로 설정 되어 있을 텐데, 몇 명이 방문하시던 상관 잆이 5명으로 입력 후, 가게요청사항에 "최가네" 라고 꼭 입력해주세요! ★방문 2~3일전 반드시 예약 문의 후 방문 부탁 드립니다. 예약 문의가 없을 시 체험이 불가능 할 수 있으니 유의 바랍니다. ★당일 체험 불가/ 예약 시 취소 될 수 있습니다 ▶당일예약 불가 및 예약 후 노쇼 시 상품에 대한 비용 청구 ▶대리 체험 불가합니다.',
  )
})

Deno.test('returns nulls when expected markup is missing', () => {
  const info = parse('<html><body>아무 정보 없음</body></html>')
  assertEquals(info.platform, '디너의여왕')
  assertEquals(info.storeName, null)
  assertEquals(info.sponsoredItems, null)
  assertEquals(info.reviewDeadline, null)
  assertEquals(info.reservationNote, null)
})
