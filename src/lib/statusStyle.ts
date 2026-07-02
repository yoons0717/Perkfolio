import { formatDDay } from './format'
import type { VisitStatus } from '../types/visit'

export const statusOrder: VisitStatus[] = ['예정', '방문완료', '리뷰완료']

export function nextStatus(current: VisitStatus): VisitStatus {
  const idx = statusOrder.indexOf(current)
  if (idx === -1) throw new Error(`Unknown visit status: ${current}`)
  return statusOrder[(idx + 1) % statusOrder.length]
}

export function statusBadgeClass(status: VisitStatus): string {
  if (status === '리뷰완료') return 'bg-green-bg text-green'
  if (status === '방문완료') return 'bg-amber-bg text-amber'
  return 'bg-blue-bg text-blue'
}

export function statusDotClass(status: VisitStatus): string {
  if (status === '리뷰완료') return 'bg-green'
  if (status === '방문완료') return 'bg-amber'
  return 'bg-blue'
}

type DeadlineDisplay = { text: string; reviewed: boolean }

export function deadlineDisplay(status: VisitStatus, reviewDeadline: string | null): DeadlineDisplay | null {
  if (!reviewDeadline) return null
  if (status === '리뷰완료') return { text: '리뷰완료', reviewed: true }
  return { text: formatDDay(reviewDeadline), reviewed: false }
}
