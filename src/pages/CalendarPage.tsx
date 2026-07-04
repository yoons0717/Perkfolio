import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import { useVisits } from '../hooks/useVisits'
import { toDateString } from '../lib/format'
import { deadlineDisplay, statusDotClass, statusTextClass } from '../lib/statusStyle'
import type { Visit } from '../types/visit'

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']

function takeWithOverflow<T>(items: T[], limit: number): { shown: T[]; extra: number } {
  const shown = items.slice(0, limit)
  return { shown, extra: items.length - shown.length }
}

export function getMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1)
  const start = new Date(year, month, 1 - firstOfMonth.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const { visits, loading, error } = useVisits()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const visitsByDate = useMemo(() => {
    const map = new Map<string, Visit[]>()
    for (const v of visits) {
      const list = map.get(v.visitDate) ?? []
      list.push(v)
      map.set(v.visitDate, list)
    }
    return map
  }, [visits])

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, Visit[]>()
    for (const v of visits) {
      if (!v.reviewDeadline) continue
      const list = map.get(v.reviewDeadline) ?? []
      list.push(v)
      map.set(v.reviewDeadline, list)
    }
    return map
  }, [visits])

  const grid = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor])

  if (loading) return null
  if (error) return <p className="text-sm text-red-400">{error}</p>

  const todayStr = toDateString(today)
  const selectedVisits = selectedDate ? (visitsByDate.get(selectedDate) ?? []) : []
  const selectedDeadlines = selectedDate ? (deadlinesByDate.get(selectedDate) ?? []) : []

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-ink"
        >
          ‹
        </Button>
        <span className="font-display font-bold text-ink">
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </span>
        <Button
          variant="ghost"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-ink"
        >
          ›
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {weekdayLabels.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {grid.map((date) => {
          const dateStr = toDateString(date)
          const inMonth = date.getMonth() === cursor.getMonth()
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const dayVisits = visitsByDate.get(dateStr) ?? []
          const dayDeadlines = deadlinesByDate.get(dateStr) ?? []
          const { shown, extra } = takeWithOverflow(dayVisits, 2)
          const { shown: shownDeadlines, extra: extraDeadlines } = takeWithOverflow(dayDeadlines, 2)
          const { shown: dots, extra: dotsExtra } = takeWithOverflow(
            [
              ...dayVisits.map((v) => ({ key: v.id, color: statusDotClass(v.status) })),
              ...dayDeadlines.map((v) => ({
                key: `dl-${v.id}`,
                color: deadlineDisplay(v.status, v.reviewDeadline)?.reviewed ? 'bg-muted' : 'bg-red-500',
              })),
            ],
            4,
          )

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={`flex min-h-[3.25rem] flex-col items-stretch rounded-lg border bg-surface p-1 text-left text-xs transition-colors hover:border-blue/60 hover:bg-white/5 sm:min-h-[6.5rem] sm:p-1.5 ${
                isToday ? 'border-blue' : 'border-line'
              } ${isSelected ? 'bg-blue-bg' : ''} ${inMonth ? '' : 'opacity-30'}`}
            >
              <span className={isToday ? 'font-bold text-blue' : 'text-muted'}>{date.getDate()}</span>

              {/* mobile: dot summary only, avoids cramped text at narrow widths */}
              <div className="mt-1 flex flex-wrap gap-1 sm:hidden">
                {dots.map((d) => (
                  <span key={d.key} className={`h-1.5 w-1.5 rounded-full ${d.color}`} />
                ))}
                {dotsExtra > 0 && <span className="text-[9px] text-muted">+{dotsExtra}</span>}
              </div>

              {/* sm+: full store-name cards */}
              <div className="mt-1.5 hidden flex-col gap-1 sm:flex">
                {shown.map((v) => (
                  <div key={v.id} className="flex h-5 items-stretch gap-1 rounded bg-white/5 px-1 py-0.5">
                    <span className={`w-[3px] rounded-sm ${statusDotClass(v.status)}`} />
                    <span className="truncate self-center text-[10px]">
                      <span className="text-ink">{v.storeName}</span>{' '}
                      <span className={statusTextClass(v.status)}>방문</span>
                    </span>
                  </div>
                ))}
                {extra > 0 && <span className="text-[10px] text-muted">+{extra}개</span>}

                {shownDeadlines.map((v) => {
                  const deadline = deadlineDisplay(v.status, v.reviewDeadline)!
                  return (
                    <div key={`dl-${v.id}`} className="flex h-5 items-stretch gap-1 rounded bg-white/5 px-1 py-0.5">
                      <span className={`w-[3px] rounded-sm ${deadline.reviewed ? 'bg-muted' : 'bg-red-500'}`} />
                      <span className="truncate self-center text-[10px]">
                        <span className="text-ink">{v.storeName}</span>{' '}
                        <span className={deadline.reviewed ? 'text-muted' : 'text-red-400'}>
                          {deadline.reviewed ? '리뷰 완료' : `마감 ${deadline.text}`}
                        </span>
                      </span>
                    </div>
                  )
                })}
                {extraDeadlines > 0 && <span className="text-[10px] text-red-400">+{extraDeadlines}개 마감</span>}
              </div>
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <div className="mt-6 rounded-xl border border-line bg-surface">
          <div className="border-b border-line px-4 py-3 font-display font-bold text-ink">
            {selectedDate}
          </div>
          {selectedVisits.length === 0 && selectedDeadlines.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">이 날짜에 등록된 방문이 없습니다.</p>
          ) : (
            <>
              {selectedVisits.map((v) => (
                <div
                  key={v.id}
                  onClick={() => navigate(`/edit/${v.id}`)}
                  className="flex cursor-pointer items-center justify-between border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-white/5"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${statusDotClass(v.status)}`} />
                    <div>
                      <p className="text-ink">{v.storeName}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {v.platform} · {v.category}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
              {selectedDeadlines.map((v) => {
                const deadline = deadlineDisplay(v.status, v.reviewDeadline)!
                return (
                  <div
                    key={`dl-${v.id}`}
                    onClick={() => navigate(`/edit/${v.id}`)}
                    className="flex cursor-pointer items-center justify-between border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-white/5"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${deadline.reviewed ? 'bg-muted' : 'bg-red-500'}`}
                      />
                      <div>
                        <p className="text-ink">{v.storeName}</p>
                        <p className={`mt-0.5 text-xs ${deadline.reviewed ? 'text-muted' : 'text-red-400'}`}>
                          {deadline.reviewed ? '리뷰 완료' : '리뷰 마감'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 font-mono text-xs ${
                        deadline.reviewed ? 'bg-line text-muted' : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {deadline.reviewed ? '완료' : deadline.text}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
