import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDDay, toDateString } from '../lib/format'
import { statusBadgeClass, statusDotClass } from '../lib/statusStyle'
import { getVisits, toggleStatus } from '../lib/visits'
import type { Visit } from '../types/visit'

const weekdayLabels = ['일', '월', '화', '수', '목', '금', '토']

function getMonthGrid(year: number, month: number): Date[] {
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
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    getVisits()
      .then(setVisits)
      .catch(() => setError('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

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

  async function handleToggle(e: React.MouseEvent, v: Visit) {
    e.stopPropagation()
    try {
      const updated = await toggleStatus(v.id, v.status)
      setVisits((prev) => prev.map((item) => (item.id === v.id ? updated : item)))
      setActionError(null)
    } catch (err) {
      console.error(err)
      setActionError('상태 변경에 실패했습니다.')
    }
  }

  if (loading) return null
  if (error) return <p className="text-sm text-red-400">{error}</p>

  const todayStr = toDateString(today)
  const selectedVisits = selectedDate ? (visitsByDate.get(selectedDate) ?? []) : []
  const selectedDeadlines = selectedDate ? (deadlinesByDate.get(selectedDate) ?? []) : []

  return (
    <div>
      {actionError && <p className="mb-3 text-sm text-red-400">{actionError}</p>}

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="px-2 text-muted"
        >
          ‹
        </button>
        <span className="font-display font-bold text-ink">
          {cursor.getFullYear()}년 {cursor.getMonth() + 1}월
        </span>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="px-2 text-muted"
        >
          ›
        </button>
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
          const shown = dayVisits.slice(0, 2)
          const extra = dayVisits.length - shown.length
          const shownDeadlines = dayDeadlines.slice(0, 2)
          const extraDeadlines = dayDeadlines.length - shownDeadlines.length
          const dots = [
            ...dayVisits.map((v) => ({ key: v.id, color: statusDotClass(v.status) })),
            ...dayDeadlines.map((v) => ({
              key: `dl-${v.id}`,
              color: v.status === '리뷰완료' ? 'bg-green' : 'bg-red-500',
            })),
          ].slice(0, 4)
          const dotsExtra = dayVisits.length + dayDeadlines.length - dots.length

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
                    <span className="truncate self-center text-[10px] text-ink">{v.storeName}</span>
                  </div>
                ))}
                {extra > 0 && <span className="text-[10px] text-muted">+{extra}개</span>}

                {shownDeadlines.map((v) => (
                  <div key={`dl-${v.id}`} className="flex h-5 items-stretch gap-1 rounded bg-white/5 px-1 py-0.5">
                    <span className={`w-[3px] rounded-sm ${v.status === '리뷰완료' ? 'bg-green' : 'bg-red-500'}`} />
                    <span className="truncate self-center text-[10px]">
                      <span className="text-ink">{v.storeName}</span>{' '}
                      {v.status === '리뷰완료' ? (
                        <span className="text-green">리뷰완료</span>
                      ) : (
                        <span className="text-red-400">
                          마감 {v.reviewDeadline && formatDDay(v.reviewDeadline)}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
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
                  <span>
                    {v.platform} · {v.storeName}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggle(e, v)}
                    className={`rounded-full px-3 py-1 font-mono text-xs ${statusBadgeClass(v.status)}`}
                  >
                    {v.status}
                  </button>
                </div>
              ))}
              {selectedDeadlines.map((v) => (
                <div
                  key={`dl-${v.id}`}
                  onClick={() => navigate(`/edit/${v.id}`)}
                  className="flex cursor-pointer items-center justify-between border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-white/5"
                >
                  <span>
                    <span className="font-medium text-ink">{v.storeName}</span>
                    <span className={`ml-2 text-xs ${v.status === '리뷰완료' ? 'text-green' : 'text-red-400'}`}>
                      {v.status === '리뷰완료' ? '리뷰완료' : '리뷰 마감'}
                    </span>
                  </span>
                  {v.status === '리뷰완료' ? (
                    <span className="rounded-full bg-green-bg px-3 py-1 font-mono text-xs text-green">
                      리뷰완료
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-500/10 px-3 py-1 font-mono text-xs text-red-400">
                      {v.reviewDeadline && formatDDay(v.reviewDeadline)}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
