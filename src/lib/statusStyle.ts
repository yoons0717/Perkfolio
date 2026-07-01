import type { VisitStatus } from '../types/visit'

export const statusOrder: VisitStatus[] = ['예정', '방문완료', '리뷰완료']

export function nextStatus(current: VisitStatus): VisitStatus {
  const idx = statusOrder.indexOf(current)
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
