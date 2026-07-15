import { categories } from '../types/visit'
import type { Category, Visit } from '../types/visit'

export type Period = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'all' | 'custom'

// retailValue가 확정된(품목형이 아닌) 방문. 금액 통계 함수들은 이 타입만 받아서,
// 품목형 방문을 실수로 금액 집계에 넣으면 컴파일 타임에 걸리도록 한다.
export type MoneyVisit = Visit & { retailValue: number }

export function hasRetailValue(visit: Visit): visit is MoneyVisit {
  return visit.retailValue !== null
}

export function netSaved(visit: MoneyVisit): number {
  return visit.retailValue - visit.extraPayment
}

export function netColorClass(visit: MoneyVisit): 'text-muted' | 'text-danger' | 'text-positive' {
  if (visit.status === '예정') return 'text-muted'
  return netSaved(visit) < 0 ? 'text-danger' : 'text-positive'
}

// 예정 상태는 아직 실제로 일어나지 않았으므로, 절감액/통계 집계에서는 제외한다.
export function confirmedVisits(visits: Visit[]): Visit[] {
  return visits.filter((v) => v.status !== '예정')
}

export type CustomRange = [Date | null, Date | null]

export function isInPeriod(visitDate: string, period: Period, customRange?: CustomRange): boolean {
  if (period === 'all') return true
  const [year, month, day] = visitDate.split('-').map(Number)

  if (period === 'custom') {
    const [start, end] = customRange ?? [null, null]
    if (!start || !end) return false
    const date = new Date(year, month - 1, day)
    const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const endOfDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    return date >= startOfDay && date <= endOfDay
  }

  const now = new Date()
  if (period === 'thisYear') return year === now.getFullYear()
  if (period === 'lastYear') return year === now.getFullYear() - 1
  if (period === 'thisMonth') return year === now.getFullYear() && month === now.getMonth() + 1

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return year === lastMonth.getFullYear() && month === lastMonth.getMonth() + 1
}

export type Totals = { count: number; retail: number; extra: number; net: number; rate: number }

export function computeTotals(visits: MoneyVisit[]): Totals {
  const retail = visits.reduce((sum, v) => sum + v.retailValue, 0)
  const extra = visits.reduce((sum, v) => sum + v.extraPayment, 0)
  const net = retail - extra
  const rate = retail === 0 ? 0 : Math.round((net / retail) * 100)
  return { count: visits.length, retail, extra, net, rate }
}

// 건수/pct는 품목형(retailValue === null) 방문도 포함해서 집계하지만,
// avgNet은 금액이 확정된 방문으로만 평균낸다 (품목형은 netSaved를 계산할 수 없음).
export function computeCategoryBreakdown(visits: Visit[]) {
  const counts = new Map<Category, number>(categories.map((c) => [c, 0]))
  const totals = new Map<Category, number>(categories.map((c) => [c, 0]))
  const moneyCounts = new Map<Category, number>(categories.map((c) => [c, 0]))
  for (const v of visits) {
    counts.set(v.category, (counts.get(v.category) ?? 0) + 1)
    if (hasRetailValue(v)) {
      totals.set(v.category, (totals.get(v.category) ?? 0) + netSaved(v))
      moneyCounts.set(v.category, (moneyCounts.get(v.category) ?? 0) + 1)
    }
  }
  const max = Math.max(1, ...counts.values())
  return categories.map((category) => {
    const count = counts.get(category) ?? 0
    const moneyCount = moneyCounts.get(category) ?? 0
    const total = totals.get(category) ?? 0
    const avgNet = moneyCount === 0 ? 0 : Math.round(total / moneyCount)
    return { category, count, moneyCount, pct: (count / max) * 100, avgNet }
  })
}

// 이번 해 1월부터 이번 달까지 고정된 축을 쓴다 — 데이터가 쌓인 달만 표시하면
// 기록이 길어질수록(예: 12개월+) x축 라벨이 겹치기 때문에, 기간을 항상
// 연초~이번 달로 제한해 라벨 개수를 예측 가능하게 유지한다.
export function computeMonthlyTrend(visits: MoneyVisit[]) {
  const now = new Date()
  const year = now.getFullYear()
  const totals = new Map<string, number>()
  const counts = new Map<string, number>()
  for (const v of visits) {
    if (v.visitDate === null) continue
    const month = v.visitDate.slice(0, 7)
    totals.set(month, (totals.get(month) ?? 0) + netSaved(v))
    counts.set(month, (counts.get(month) ?? 0) + 1)
  }
  return Array.from({ length: now.getMonth() + 1 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`
    const count = counts.get(month) ?? 0
    const total = totals.get(month) ?? 0
    return { month, avgNet: count === 0 ? 0 : Math.round(total / count) }
  })
}
