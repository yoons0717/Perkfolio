import { deadlineDisplay, statusOrder } from './statusStyle'
import type { Category, Visit, VisitStatus } from '../types/visit'

export type Period = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'all' | 'custom'

const categories: Category[] = ['카페', '음식점', '술집', '기타']

export function netSaved(visit: Visit): number {
  return visit.retailValue - visit.extraPayment
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

export function computeTotals(visits: Visit[]): Totals {
  const retail = visits.reduce((sum, v) => sum + v.retailValue, 0)
  const extra = visits.reduce((sum, v) => sum + v.extraPayment, 0)
  const net = retail - extra
  const rate = retail === 0 ? 0 : Math.round((net / retail) * 100)
  return { count: visits.length, retail, extra, net, rate }
}

export function computeStatusCounts(visits: Visit[]): { status: VisitStatus; count: number }[] {
  const counts = new Map<VisitStatus, number>(statusOrder.map((s) => [s, 0]))
  for (const v of visits) counts.set(v.status, (counts.get(v.status) ?? 0) + 1)
  return statusOrder.map((status) => ({ status, count: counts.get(status) ?? 0 }))
}

function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [year, month, day] = dateStr.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function computeUpcomingDeadlines(visits: Visit[], withinDays = 3) {
  return visits
    .filter((v): v is Visit & { reviewDeadline: string } => v.reviewDeadline !== null && v.status !== '리뷰완료')
    .filter((v) => daysUntil(v.reviewDeadline) <= withinDays)
    .map((v) => ({ visit: v, deadline: deadlineDisplay(v.status, v.reviewDeadline)! }))
    .sort((a, b) => (a.visit.reviewDeadline < b.visit.reviewDeadline ? -1 : 1))
}

export function computeCategoryBreakdown(visits: Visit[]) {
  const counts = new Map<Category, number>(categories.map((c) => [c, 0]))
  for (const v of visits) counts.set(v.category, (counts.get(v.category) ?? 0) + 1)
  const max = Math.max(1, ...counts.values())
  return categories.map((category) => {
    const count = counts.get(category) ?? 0
    return { category, count, pct: (count / max) * 100 }
  })
}

export function computePlatformRanking(visits: Visit[]) {
  const totals = new Map<string, number>()
  const counts = new Map<string, number>()
  for (const v of visits) {
    totals.set(v.platform, (totals.get(v.platform) ?? 0) + netSaved(v))
    counts.set(v.platform, (counts.get(v.platform) ?? 0) + 1)
  }
  return [...totals.entries()]
    .map(([platform, total]) => ({ platform, avgNet: Math.round(total / (counts.get(platform) ?? 1)) }))
    .sort((a, b) => b.avgNet - a.avgNet)
}

export function computeMonthlyTrend(visits: Visit[]) {
  const totals = new Map<string, number>()
  for (const v of visits) {
    const month = v.visitDate.slice(0, 7)
    totals.set(month, (totals.get(month) ?? 0) + netSaved(v))
  }
  return [...totals.entries()].map(([month, net]) => ({ month, net })).sort((a, b) => (a.month < b.month ? -1 : 1))
}
