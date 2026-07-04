import { netSaved } from './visitStats'
import type { Visit } from '../types/visit'

const headers = ['방문(예정)일', '마감일', '플랫폼', '업체명', '카테고리', '체험가', '추가결제액', '순절감액', '상태']

function escapeCsvField(value: string | number): string {
  const s = String(value)
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function visitToRow(visit: Visit): string {
  return [
    visit.visitDate,
    visit.reviewDeadline ?? '',
    visit.platform,
    visit.storeName,
    visit.category,
    visit.retailValue,
    visit.extraPayment,
    netSaved(visit),
    visit.status,
  ]
    .map(escapeCsvField)
    .join(',')
}

export function visitsToCsv(visits: Visit[]): string {
  const rows = [headers.join(','), ...visits.map(visitToRow)]
  return rows.map((row) => `${row}\r\n`).join('')
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
