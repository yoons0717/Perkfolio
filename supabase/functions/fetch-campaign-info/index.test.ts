import { assertEquals } from 'jsr:@std/assert'
import { handleRequest } from './index.ts'

function makeReq(body: unknown, authHeader: string | null = 'Bearer token'): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (authHeader) headers.set('Authorization', authHeader)
  return new Request('https://example.com/fetch-campaign-info', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

Deno.test('returns 401 when there is no Authorization header', async () => {
  const res = await handleRequest(makeReq({ url: 'https://dinnerqueen.net/taste/1' }, null), {
    verifyUser: () => Promise.resolve(false),
    fetchImpl: fetch,
  })
  assertEquals(res.status, 401)
  assertEquals((await res.json()).error, '인증 정보가 없습니다.')
})

Deno.test('returns 400 for a non-JSON request body, not the generic fetch-failure message', async () => {
  const req = new Request('https://example.com/fetch-campaign-info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token' },
    body: 'not json',
  })
  const res = await handleRequest(req, {
    verifyUser: () => Promise.resolve(true),
    fetchImpl: fetch,
  })
  assertEquals(res.status, 400)
  assertEquals((await res.json()).error, '올바른 URL이 아니에요.')
})

Deno.test('returns 400 when the url field is missing from the body', async () => {
  const res = await handleRequest(makeReq({}), {
    verifyUser: () => Promise.resolve(true),
    fetchImpl: fetch,
  })
  assertEquals(res.status, 400)
  assertEquals((await res.json()).error, '올바른 URL이 아니에요.')
})

Deno.test('returns 400 for a malformed url', async () => {
  const res = await handleRequest(makeReq({ url: 'not-a-url' }), {
    verifyUser: () => Promise.resolve(true),
    fetchImpl: fetch,
  })
  assertEquals(res.status, 400)
  assertEquals((await res.json()).error, '올바른 URL이 아니에요.')
})

Deno.test('returns 400 for an unsupported domain', async () => {
  const res = await handleRequest(makeReq({ url: 'https://revu.net/campaigns/1' }), {
    verifyUser: () => Promise.resolve(true),
    fetchImpl: fetch,
  })
  assertEquals(res.status, 400)
  assertEquals((await res.json()).error, '지원하지 않는 사이트예요. 직접 입력해주세요.')
})

Deno.test('returns 400 for a hostname suffix bypass attempt', async () => {
  const res = await handleRequest(
    makeReq({ url: 'https://dinnerqueen.net.evil.com/taste/1' }),
    { verifyUser: () => Promise.resolve(true), fetchImpl: fetch },
  )
  assertEquals(res.status, 400)
  assertEquals((await res.json()).error, '지원하지 않는 사이트예요. 직접 입력해주세요.')
})

Deno.test('returns 502 without parsing when the target site responds non-2xx', async () => {
  // Body is real, parseable campaign HTML — if the 404 status were ignored and
  // this got parsed anyway, the response would contain a storeName instead of
  // just an error.
  const html = await Deno.readTextFile(
    new URL('./parsers/fixtures/dinnerqueen-sample.html', import.meta.url),
  )
  const res = await handleRequest(makeReq({ url: 'https://dinnerqueen.net/taste/1' }), {
    verifyUser: () => Promise.resolve(true),
    fetchImpl: () => Promise.resolve(new Response(html, { status: 404 })),
  })
  assertEquals(res.status, 502)
  const body = await res.json()
  assertEquals(body.error, '정보를 가져오지 못했어요. 잠시 후 다시 시도해주세요.')
  assertEquals(body.storeName, undefined)
})

Deno.test('returns 502 when the target fetch throws', async () => {
  const res = await handleRequest(makeReq({ url: 'https://dinnerqueen.net/taste/1' }), {
    verifyUser: () => Promise.resolve(true),
    fetchImpl: () => Promise.reject(new Error('network down')),
  })
  assertEquals(res.status, 502)
})

Deno.test('returns parsed campaign info on success', async () => {
  const html = await Deno.readTextFile(
    new URL('./parsers/fixtures/dinnerqueen-sample.html', import.meta.url),
  )
  const res = await handleRequest(makeReq({ url: 'https://dinnerqueen.net/taste/1477357' }), {
    verifyUser: () => Promise.resolve(true),
    fetchImpl: () => Promise.resolve(new Response(html, { status: 200 })),
  })
  assertEquals(res.status, 200)
  const body = await res.json()
  assertEquals(body.platform, '디너의여왕')
  assertEquals(body.storeName, '최가네샤브버섯칼국수')
})

Deno.test('OPTIONS requests skip auth and return ok', async () => {
  const req = new Request('https://example.com/fetch-campaign-info', { method: 'OPTIONS' })
  const res = await handleRequest(req, {
    verifyUser: () => Promise.resolve(false),
    fetchImpl: fetch,
  })
  assertEquals(res.status, 200)
})
