import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Select from '../components/Select'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useIsMobile } from '../hooks/useIsMobile'
import { useVisits } from '../hooks/useVisits'
import { formatWon } from '../lib/format'
import {
  deadlineDisplay,
  deadlineUrgentBadgeClass,
  deadlineUrgentDotClass,
  deadlineUrgentTextClass,
  statusOrder,
} from '../lib/statusStyle'
import { netSaved } from '../lib/visitStats'
import { platforms } from '../types/visit'
import type { Category, Platform, Visit, VisitStatus } from '../types/visit'

type SortKey =
  | 'visitDate'
  | 'reviewDeadline'
  | 'storeName'
  | 'retailValue'
  | 'extraPayment'
  | 'netSaved'

type Column = {
  key: SortKey
  label: string
}

const columns: Column[] = [
  { key: 'reviewDeadline', label: '마감일' },
  { key: 'visitDate', label: '체험(예정)일' },
  { key: 'storeName', label: '업체명' },
  { key: 'retailValue', label: '체험가' },
  { key: 'extraPayment', label: '추가결제액' },
  { key: 'netSaved', label: '순절감액' },
]

function sortValue(v: Visit, key: SortKey): string | number {
  if (key === 'netSaved') return netSaved(v)
  if (key === 'reviewDeadline') return v.reviewDeadline ?? ''
  if (key === 'visitDate') return v.visitDate ?? ''
  return v[key]
}

// Filters live in the URL (not useState) so they survive navigating to
// /edit/:id and back, instead of resetting on remount.
function parseStatusFilter(value: string | null): '전체' | VisitStatus {
  return value && (statusOrder as string[]).includes(value) ? (value as VisitStatus) : '전체'
}

function parsePlatformFilter(value: string | null): '전체' | Platform {
  return value && (platforms as string[]).includes(value) ? (value as Platform) : '전체'
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function StatusFilterMenu({
  value,
  onChange,
}: {
  value: '전체' | VisitStatus
  onChange: (value: '전체' | VisitStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const options: Array<'전체' | VisitStatus> = ['전체', ...statusOrder]

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (btnRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function toggleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen((o) => !o)
  }

  return (
    <>
      <Button
        ref={btnRef}
        variant="ghost"
        onClick={toggleOpen}
        className={`flex items-center gap-1 hover:text-ink ${value !== '전체' ? 'text-blue' : ''}`}
      >
        <span className="text-[11px]">상태</span>
        <Chevron
          className={`inline-block transition-transform ${open ? 'rotate-180' : ''} ${
            value !== '전체' ? 'text-blue' : 'text-muted/40'
          }`}
        />
      </Button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-50 min-w-28 rounded-lg border border-line bg-surface py-1 shadow-lg shadow-black/30"
          >
            {options.map((opt) => (
              <Button
                key={opt}
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={`block w-full px-3 py-1.5 text-left font-sans normal-case tracking-normal hover:bg-line/40 ${
                  value === opt ? 'font-semibold text-ink' : 'text-muted'
                }`}
              >
                {opt}
              </Button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

function DeadlineCell({ visit }: { visit: Visit }) {
  const deadline = deadlineDisplay(visit.status, visit.reviewDeadline)
  if (!deadline) return <span className="text-muted">-</span>
  // Reviewed deadlines stay plain here — the row's own status badge already
  // shows 리뷰완료 in violet, so repeating that color in this column too
  // would be redundant (unlike CalendarPage, which has no separate badge).
  if (deadline.reviewed) return <span className="text-muted">{visit.reviewDeadline}</span>
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="text-ink">{visit.reviewDeadline}</span>
      <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold ${deadlineUrgentBadgeClass}`}>
        {deadline.text}
      </span>
    </div>
  )
}

const categoryIcon: Record<Category, string> = {
  카페: '☕',
  음식점: '🍚',
  술집: '🍺',
  기타: '✨',
}

function VisitCard({ visit, onNavigate }: { visit: Visit; onNavigate: () => void }) {
  const net = netSaved(visit)
  const netColor = visit.status === '예정' ? 'text-muted' : net < 0 ? 'text-danger' : 'text-positive'
  const deadline = deadlineDisplay(visit.status, visit.reviewDeadline)

  return (
    <div
      onClick={onNavigate}
      className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-black/10 transition-colors hover:border-blue/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-line text-base">
            {categoryIcon[visit.category]}
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-extrabold text-ink">{visit.storeName}</p>
            <p className="mt-0.5 truncate text-xs text-muted">
              {visit.platform} · {visit.visitDate ?? '-'}
              {visit.reservationNote && ` · ${visit.reservationNote}`}
            </p>
          </div>
        </div>
        <StatusBadge status={visit.status} />
      </div>

      {deadline && !deadline.reviewed && (
        <p className={`flex items-center gap-1.5 text-xs ${deadlineUrgentTextClass}`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${deadlineUrgentDotClass}`} />
          {`마감 ${visit.reviewDeadline} (${deadline.text})`}
        </p>
      )}

      <div className="flex items-end justify-between border-t border-line pt-3">
        <div className="flex flex-col gap-0.5 font-mono text-xs text-muted">
          <div className="flex justify-between gap-4">
            <span>체험가</span>
            <span>{formatWon(visit.retailValue)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>추가결제</span>
            <span>{formatWon(visit.extraPayment)}</span>
          </div>
        </div>
        <span className={`font-mono text-lg font-bold ${netColor}`}>
          {visit.status === '예정' ? '-' : formatWon(net)}
        </span>
      </div>
    </div>
  )
}

export default function TablePage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { visits, loading, error } = useVisits()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = parseStatusFilter(searchParams.get('status'))
  const platformFilter = parsePlatformFilter(searchParams.get('platform'))
  const [sortKey, setSortKey] = useState<SortKey>('reviewDeadline')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function setStatusFilter(value: '전체' | VisitStatus) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === '전체') next.delete('status')
      else next.set('status', value)
      return next
    })
  }

  function setPlatformFilter(value: '전체' | Platform) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === '전체') next.delete('platform')
      else next.set('platform', value)
      return next
    })
  }

  const statusCounts = useMemo(
    () => ({
      예정: visits.filter((v) => v.status === '예정').length,
      리뷰완료: visits.filter((v) => v.status === '리뷰완료').length,
    }),
    [visits],
  )

  const visible = useMemo(() => {
    let result = visits
    if (statusFilter !== '전체') result = result.filter((v) => v.status === statusFilter)
    if (platformFilter !== '전체') result = result.filter((v) => v.platform === platformFilter)

    result = [...result].sort((a, b) => {
      // 예정 visits don't show a real 순절감액 (displayed as "-", since the
      // amount isn't confirmed yet), so sorting by that column pins them to
      // the end regardless of asc/desc — otherwise the unconfirmed
      // placeholder rows would interleave with the real sorted values.
      if (sortKey === 'netSaved') {
        const aPending = a.status === '예정'
        const bPending = b.status === '예정'
        if (aPending || bPending) return aPending && bPending ? 0 : aPending ? 1 : -1
      }

      // same pinning idea for a visit with no confirmed date yet.
      if (sortKey === 'visitDate') {
        const aNoDate = a.visitDate === null
        const bNoDate = b.visitDate === null
        if (aNoDate || bNoDate) return aNoDate && bNoDate ? 0 : aNoDate ? 1 : -1
      }

      // and for a visit with no review deadline set at all (rare, but the
      // type still allows it) — a missing deadline is never "most urgent".
      if (sortKey === 'reviewDeadline') {
        const aNoDeadline = a.reviewDeadline === null
        const bNoDeadline = b.reviewDeadline === null
        if (aNoDeadline || bNoDeadline) return aNoDeadline && bNoDeadline ? 0 : aNoDeadline ? 1 : -1
      }

      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [visits, statusFilter, platformFilter, sortKey, sortDir])

  const resetKey = `${statusFilter}|${platformFilter}|${sortKey}|${sortDir}`
  const { displayCount, sentinelRef } = useInfiniteScroll(visible.length, resetKey)
  const pageVisits = visible.slice(0, displayCount)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (loading) return <Spinner />
  if (error) return <p className="text-sm text-danger">{error}</p>

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex gap-3">
        <Button
          variant="ghost"
          onClick={() => setStatusFilter(statusFilter === '예정' ? '전체' : '예정')}
          className={`flex-1 rounded-2xl border p-4 text-left ${
            statusFilter === '예정' ? 'border-blue bg-blue-bg' : 'border-line bg-surface'
          }`}
        >
          <p className="text-xs font-semibold text-muted">방문 예정</p>
          <p className={`mt-1 font-mono text-3xl font-extrabold ${statusFilter === '예정' ? 'text-blue' : 'text-ink'}`}>
            {statusCounts.예정}
          </p>
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStatusFilter(statusFilter === '리뷰완료' ? '전체' : '리뷰완료')}
          className={`flex-1 rounded-2xl border p-4 text-left ${
            statusFilter === '리뷰완료' ? 'border-violet bg-violet-bg' : 'border-line bg-surface'
          }`}
        >
          <p className="text-xs font-semibold text-muted">리뷰 완료</p>
          <p
            className={`mt-1 font-mono text-3xl font-extrabold ${statusFilter === '리뷰완료' ? 'text-violet' : 'text-ink'}`}
          >
            {statusCounts.리뷰완료}
          </p>
        </Button>
      </div>

      <div className="mb-4 flex gap-3">
        {isMobile && (
          <div className="w-36">
            <Select
              aria-label="상태 필터"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as '전체' | VisitStatus)}
              className="rounded-lg border border-line bg-surface px-3 py-3 text-sm text-ink"
            >
              <option value="전체">상태 전체</option>
              {statusOrder.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="w-36">
          <Select
            aria-label="플랫폼 필터"
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as '전체' | Platform)}
            className="rounded-lg border border-line bg-surface px-3 py-3 text-sm text-ink"
          >
            <option value="전체">플랫폼 전체</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          아직 등록된 체험단 기록이 없습니다.
        </p>
      ) : (
        <>
          {isMobile ? (
            <div className="flex flex-col gap-3">
              {pageVisits.map((v) => (
                <VisitCard key={v.id} visit={v} onNavigate={() => navigate(`/edit/${v.id}`)} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[860px] border-collapse whitespace-nowrap text-xs">
                <thead>
                  <tr className="border-b border-line bg-surface text-left text-muted">
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className={`cursor-pointer select-none px-4 py-2.5 font-mono text-[11px] font-normal tracking-wide uppercase transition-colors hover:text-ink ${
                          sortKey === col.key ? 'text-ink' : ''
                        }`}
                      >
                        {col.label}{' '}
                        <Chevron
                          className={`inline-block transition-transform ${
                            sortKey === col.key ? `text-blue ${sortDir === 'asc' ? 'rotate-180' : ''}` : 'text-muted/40'
                          }`}
                        />
                      </th>
                    ))}
                    <th className="py-2.5 pr-6 pl-4 font-mono text-[11px] font-normal tracking-wide uppercase">
                      <StatusFilterMenu value={statusFilter} onChange={setStatusFilter} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageVisits.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/edit/${v.id}`)}
                      className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface"
                    >
                      <td className="px-4 py-3 font-mono">
                        <DeadlineCell visit={v} />
                      </td>
                      <td className="px-4 py-3 font-mono text-ink">{v.visitDate ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{v.storeName}</div>
                        <div className="max-w-[220px] truncate text-xs text-muted">
                          {v.platform} · {v.category}
                          {v.reservationNote && ` · ${v.reservationNote}`}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{formatWon(v.retailValue)}</td>
                      <td className="px-4 py-3 font-mono">{formatWon(v.extraPayment)}</td>
                      <td
                        className={`px-4 py-3 font-mono ${
                          v.status === '예정'
                            ? 'text-muted'
                            : `font-semibold ${netSaved(v) < 0 ? 'text-danger' : 'text-positive'}`
                        }`}
                      >
                        {v.status === '예정' ? '-' : formatWon(netSaved(v))}
                      </td>
                      <td className="py-3 pr-6 pl-4">
                        <StatusBadge status={v.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div ref={sentinelRef} />
        </>
      )}
    </div>
  )
}
