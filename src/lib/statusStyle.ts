import { formatDDay } from './format'
import type { VisitStatus } from '../types/visit'

export const statusOrder: VisitStatus[] = ['예정', '리뷰완료']

export function statusBadgeClass(status: VisitStatus): string {
  if (status === '리뷰완료') return 'bg-violet-bg text-violet'
  return 'bg-white/5 text-muted'
}

export function statusDotClass(status: VisitStatus): string {
  if (status === '리뷰완료') return 'bg-violet'
  return 'bg-muted'
}

export function statusTextClass(status: VisitStatus): string {
  if (status === '리뷰완료') return 'text-violet'
  return 'text-muted'
}

type DeadlineDisplay = { text: string; reviewed: boolean }

export function deadlineDisplay(status: VisitStatus, reviewDeadline: string | null): DeadlineDisplay | null {
  if (!reviewDeadline) return null
  if (status === '리뷰완료') return { text: '리뷰완료', reviewed: true }
  return { text: formatDDay(reviewDeadline), reviewed: false }
}

// Single source of truth for "this deadline still needs attention" — used
// by both TablePage and CalendarPage wherever an unreviewed deadline is
// shown, so the urgency color only needs to change in one place.
export const deadlineUrgentTextClass = 'text-red-400'
export const deadlineUrgentDotClass = 'bg-red-500'
export const deadlineUrgentBadgeClass = 'bg-red-500/10 text-red-400'
