import { deadlineDisplay, statusOrder } from './statusStyle'
import { categories } from '../types/visit'
import type { Category, Visit, VisitStatus } from '../types/visit'

export type Period = 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'all' | 'custom'

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
  const totals = new Map<Category, number>(categories.map((c) => [c, 0]))
  for (const v of visits) {
    counts.set(v.category, (counts.get(v.category) ?? 0) + 1)
    totals.set(v.category, (totals.get(v.category) ?? 0) + netSaved(v))
  }
  const max = Math.max(1, ...counts.values())
  return categories.map((category) => {
    const count = counts.get(category) ?? 0
    const total = totals.get(category) ?? 0
    const avgNet = count === 0 ? 0 : Math.round(total / count)
    return { category, count, pct: (count / max) * 100, avgNet }
  })
}

export function computePlatformRanking(visits: Visit[]) {
  const totals = new Map<string, number>()
  const counts = new Map<string, number>()
  for (const v of visits) {
    totals.set(v.platform, (totals.get(v.platform) ?? 0) + netSaved(v))
    counts.set(v.platform, (counts.get(v.platform) ?? 0) + 1)
  }
  const ranked = [...totals.entries()].map(([platform, total]) => {
    const count = counts.get(platform) ?? 1
    return { platform, avgNet: Math.round(total / count), count }
  })
  const maxAbs = Math.max(1, ...ranked.map((r) => Math.abs(r.avgNet)))
  return ranked
    .map((r) => ({ ...r, pct: (Math.abs(r.avgNet) / maxAbs) * 100 }))
    .sort((a, b) => b.avgNet - a.avgNet)
}

// 이번 해 1월부터 이번 달까지 고정된 축을 쓴다 — 데이터가 쌓인 달만 표시하면
// 기록이 길어질수록(예: 12개월+) x축 라벨이 겹치기 때문에, 기간을 항상
// 연초~이번 달로 제한해 라벨 개수를 예측 가능하게 유지한다.
export function computeMonthlyTrend(visits: Visit[]) {
  const now = new Date()
  const year = now.getFullYear()
  const totals = new Map<string, number>()
  for (const v of visits) {
    if (v.visitDate === null) continue
    const month = v.visitDate.slice(0, 7)
    totals.set(month, (totals.get(month) ?? 0) + netSaved(v))
  }
  return Array.from({ length: now.getMonth() + 1 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, '0')}`
    return { month, net: totals.get(month) ?? 0 }
  })
}

// computeCategoryBreakdown/computePlatformRanking의 평균 절감액 계산 로직을
// 축(category/platform/month)에 무관하게 일반화한 버전. 커스텀 그래프 위젯에서 사용한다.
// Note: category 축은 고정된 전체 카테고리를 반환하고(zero-count 포함), platform/month는 등장한 값만 반환한다.
export function computeGraphData(
  visits: Visit[],
  axis: 'category' | 'platform' | 'month',
): { label: string; avgNet: number; totalNet: number; count: number }[] {
  const totals = new Map<string, number>()
  const counts = new Map<string, number>()

  for (const v of visits) {
    if (axis === 'month' && v.visitDate === null) continue
    const key = axis === 'category' ? v.category : axis === 'platform' ? v.platform : v.visitDate!.slice(0, 7)
    totals.set(key, (totals.get(key) ?? 0) + netSaved(v))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  // category는 고정된 축(categories 순서)을 쓰고, platform/month는 정해진 전체 집합이 없으므로
  // 등장한 값만 알파벳/오름차순 정렬해 보여준다.
  const labels: string[] = axis === 'category' ? categories : [...totals.keys()].sort()

  return labels.map((label) => {
    const count = counts.get(label) ?? 0
    const total = totals.get(label) ?? 0
    return { label, avgNet: count === 0 ? 0 : Math.round(total / count), totalNet: total, count }
  })
}

// 그래프별 scope는 상단 기간 필터와 독립적으로, 그래프 자신의 기간 선택을 따른다.
// 그래프 카드와 빌더 폼 미리보기가 동일한 필터링 로직을 공유하기 위해 여기 둔다.
export function visitsForGraphScope(
  scope: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear',
  allTimeConfirmed: Visit[],
): Visit[] {
  if (scope === 'all') return allTimeConfirmed
  return allTimeConfirmed.filter((v) => v.visitDate !== null && isInPeriod(v.visitDate, scope))
}
