export function formatWon(n: number): string {
  return `₩${n.toLocaleString('ko-KR')}`
}

export function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
