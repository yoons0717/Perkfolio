export function formatWon(n: number): string {
  return `₩${n.toLocaleString('ko-KR')}`
}

export function formatDDay(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [year, month, day] = dateStr.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diffDays === 0) return 'D-DAY'
  return diffDays > 0 ? `D-${diffDays}` : `D+${Math.abs(diffDays)}`
}
