import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadCsv, visitsToCsv } from './csvExport'
import { makeVisit } from '../test/factories'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('visitsToCsv', () => {
  it('writes the header row matching the table columns', () => {
    const csv = visitsToCsv([])
    expect(csv).toBe('방문(예정)일,마감일,플랫폼,업체명,카테고리,체험가,추가결제액,순절감액,상태\r\n')
  })

  it('writes one data row per visit with raw numeric amounts and computed net savings', () => {
    const visit = makeVisit({
      visitDate: '2026-01-10',
      reviewDeadline: '2026-01-13',
      platform: '포포몬',
      storeName: '카페 온도',
      category: '카페',
      retailValue: 48000,
      extraPayment: 5000,
      status: '방문완료',
    })

    const csv = visitsToCsv([visit])

    expect(csv).toBe(
      '방문(예정)일,마감일,플랫폼,업체명,카테고리,체험가,추가결제액,순절감액,상태\r\n' +
        '2026-01-10,2026-01-13,포포몬,카페 온도,카페,48000,5000,43000,방문완료\r\n',
    )
  })

  it('writes an empty field for a visit with no review deadline, not a computed D-day label', () => {
    const visit = makeVisit({ reviewDeadline: null })

    const csv = visitsToCsv([visit])

    expect(csv.split('\r\n')[1]).toContain(',,')
  })

  it('shows a negative net savings as a plain negative number', () => {
    const visit = makeVisit({ retailValue: 10000, extraPayment: 15000 })

    const csv = visitsToCsv([visit])

    expect(csv.split('\r\n')[1]).toContain(',-5000,')
  })

  it('quotes a field containing a comma', () => {
    const visit = makeVisit({ storeName: '카페, 온도' })

    const csv = visitsToCsv([visit])

    expect(csv.split('\r\n')[1]).toContain('"카페, 온도"')
  })

  it('quotes and doubles an embedded double-quote', () => {
    const visit = makeVisit({ storeName: '카페 "온도"' })

    const csv = visitsToCsv([visit])

    expect(csv.split('\r\n')[1]).toContain('"카페 ""온도"""')
  })
})

describe('downloadCsv', () => {
  it('triggers an anchor click with the given filename and a UTF-8 BOM-prefixed CSV blob', async () => {
    const anchor = { click: vi.fn(), href: '', download: '' } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })

    downloadCsv('perkfolio_visits_2026-07-04.csv', 'a,b\r\n1,2\r\n')

    expect(anchor.download).toBe('perkfolio_visits_2026-07-04.csv')
    expect(anchor.click).toHaveBeenCalledTimes(1)

    const blob = createObjectURL.mock.calls[0][0] as Blob
    expect(blob.type).toBe('text/csv;charset=utf-8')
    // .text() decodes as UTF-8 and strips a leading BOM per spec, so the BOM
    // bytes are verified directly on the wire instead (Excel needs them to
    // render Korean text correctly; they're invisible once decoded back).
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect(Array.from(bytes.slice(0, 3))).toEqual([0xef, 0xbb, 0xbf])
    expect(await blob.text()).toBe('a,b\r\n1,2\r\n')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
