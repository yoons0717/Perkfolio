import { assertEquals } from 'jsr:@std/assert'
import { decodeHtmlText, truncate } from './common.ts'

Deno.test('decodeHtmlText strips tags and decodes entities', () => {
  const input = '텍스트<br>줄바꿈 &lt;태그&gt; &amp; &nbsp;공백'
  assertEquals(decodeHtmlText(input), '텍스트 줄바꿈 <태그> & 공백')
})

Deno.test('decodeHtmlText collapses whitespace and trims', () => {
  assertEquals(decodeHtmlText('  여러   줄\n\n공백  '), '여러 줄 공백')
})

Deno.test('truncate leaves short strings unchanged', () => {
  assertEquals(truncate('짧은 텍스트'), '짧은 텍스트')
})

Deno.test('truncate caps long strings at 300 chars', () => {
  const long = 'a'.repeat(400)
  const result = truncate(long)
  assertEquals(result.length, 300)
})
