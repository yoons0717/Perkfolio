import { assertEquals, assertExists } from 'jsr:@std/assert'
import { resolveTarget } from './resolveTarget.ts'

Deno.test('resolves dinnerqueen.net to the dinnerqueen parser', () => {
  const target = resolveTarget('dinnerqueen.net')
  assertExists(target)
  assertEquals(target.parse('').platform, '디너의여왕')
})

Deno.test('resolves www.dinnerqueen.net to the dinnerqueen parser', () => {
  const target = resolveTarget('www.dinnerqueen.net')
  assertExists(target)
  assertEquals(target.parse('').platform, '디너의여왕')
})

Deno.test('resolves the punycode hostname to the gangnammatzip parser', () => {
  const target = resolveTarget('xn--939au0g4vj8sq.net')
  assertExists(target)
  assertEquals(target.parse('').platform, '강남맛집')
})

Deno.test('returns null for an unsupported hostname', () => {
  assertEquals(resolveTarget('revu.net'), null)
})

Deno.test('returns null for a hostname suffix bypass attempt', () => {
  assertEquals(resolveTarget('dinnerqueen.net.evil.com'), null)
})

Deno.test('returns null for an empty hostname', () => {
  assertEquals(resolveTarget(''), null)
})
