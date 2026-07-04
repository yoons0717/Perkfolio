import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from '../components/Select'
import StatusBadgeButton from '../components/StatusBadgeButton'
import { useIsMobile } from '../hooks/useIsMobile'
import { useVisitActions } from '../hooks/useVisitActions'
import { useVisits } from '../hooks/useVisits'
import { formatWon } from '../lib/format'
import { deadlineDisplay, statusOrder } from '../lib/statusStyle'
import { netSaved } from '../lib/visitStats'
import { platforms } from '../types/visit'
import type { Category, Platform, Visit, VisitStatus } from '../types/visit'

type SortKey =
  | 'visitDate'
  | 'reviewDeadline'
  | 'platform'
  | 'storeName'
  | 'category'
  | 'retailValue'
  | 'extraPayment'
  | 'netSaved'

type Column = {
  key: SortKey
  label: string
}

const columns: Column[] = [
  { key: 'visitDate', label: '방문(예정)일' },
  { key: 'reviewDeadline', label: '마감일' },
  { key: 'platform', label: '플랫폼' },
  { key: 'storeName', label: '업체명' },
  { key: 'category', label: '카테고리' },
  { key: 'retailValue', label: '체험가' },
  { key: 'extraPayment', label: '추가결제액' },
  { key: 'netSaved', label: '순절감액' },
]

function sortValue(v: Visit, key: SortKey): string | number {
  if (key === 'netSaved') return netSaved(v)
  if (key === 'reviewDeadline') return v.reviewDeadline ?? ''
  return v[key]
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

function DeadlineCell({ visit }: { visit: Visit }) {
  const deadline = deadlineDisplay(visit.status, visit.reviewDeadline)
  if (!deadline) return <span className="text-muted">-</span>
  return (
    <span className={deadline.reviewed ? 'text-green' : 'text-red-400'}>
      {visit.reviewDeadline} <span className="text-[10px] text-muted">({deadline.reviewed ? '완료' : deadline.text})</span>
    </span>
  )
}

const categoryIcon: Record<Category, string> = {
  카페: '☕',
  음식점: '🍚',
  술집: '🍺',
  기타: '✨',
}

function VisitCard({
  visit,
  onNavigate,
  onToggleStatus,
}: {
  visit: Visit
  onNavigate: () => void
  onToggleStatus: (e: React.MouseEvent) => void
}) {
  const net = netSaved(visit)
  const netColor = visit.status === '예정' ? 'text-muted' : net < 0 ? 'text-red-400' : 'text-green'
  const deadline = deadlineDisplay(visit.status, visit.reviewDeadline)

  return (
    <div
      onClick={onNavigate}
      className="flex cursor-pointer flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-black/10 transition-colors hover:border-blue/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-line text-base">
            {categoryIcon[visit.category]}
          </span>
          <div>
            <p className="font-display text-base font-extrabold text-ink">{visit.storeName}</p>
            <p className="mt-0.5 text-xs text-muted">
              {visit.platform} · {visit.visitDate}
            </p>
          </div>
        </div>
        <StatusBadgeButton status={visit.status} onClick={onToggleStatus} />
      </div>

      {deadline && (
        <p className={`flex items-center gap-1.5 text-xs ${deadline.reviewed ? 'text-muted' : 'text-red-400'}`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${deadline.reviewed ? 'bg-muted' : 'bg-red-500'}`} />
          {deadline.reviewed ? '리뷰 완료' : `마감 ${visit.reviewDeadline} (${deadline.text})`}
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
        <span className={`font-mono text-lg font-bold ${netColor}`}>{formatWon(net)}</span>
      </div>
    </div>
  )
}

export default function TablePage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { visits, setVisits, loading, error } = useVisits()
  const { actionError, handleToggleStatus } = useVisitActions(setVisits)
  const [statusFilter, setStatusFilter] = useState<'전체' | VisitStatus>('전체')
  const [platformFilter, setPlatformFilter] = useState<'전체' | Platform>('전체')
  const [sortKey, setSortKey] = useState<SortKey>('visitDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const visible = useMemo(() => {
    let result = visits
    if (statusFilter !== '전체') result = result.filter((v) => v.status === statusFilter)
    if (platformFilter !== '전체') result = result.filter((v) => v.platform === platformFilter)

    result = [...result].sort((a, b) => {
      const av = sortValue(a, sortKey)
      const bv = sortValue(b, sortKey)
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [visits, statusFilter, platformFilter, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  if (loading) return null
  if (error) return <p className="text-sm text-red-400">{error}</p>

  return (
    <div>
      {actionError && <p className="mb-3 text-sm text-red-400">{actionError}</p>}

      <div className="mb-4 flex gap-3">
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
          아직 등록된 방문 기록이 없습니다.
        </p>
      ) : isMobile ? (
        <div className="flex flex-col gap-3">
          {visible.map((v) => (
            <VisitCard
              key={v.id}
              visit={v}
              onNavigate={() => navigate(`/edit/${v.id}`)}
              onToggleStatus={(e) => handleToggleStatus(e, v)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[860px] border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-muted">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`cursor-pointer select-none px-4 py-3 font-semibold transition-colors hover:text-ink ${
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
                <th className="py-3 pr-6 pl-4 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => navigate(`/edit/${v.id}`)}
                  className="cursor-pointer border-b border-line last:border-b-0 hover:bg-surface"
                >
                  <td className="px-4 py-3 font-mono text-ink">{v.visitDate}</td>
                  <td className="px-4 py-3 font-mono">
                    <DeadlineCell visit={v} />
                  </td>
                  <td className="px-4 py-3">{v.platform}</td>
                  <td className="px-4 py-3">{v.storeName}</td>
                  <td className="px-4 py-3">{v.category}</td>
                  <td className="px-4 py-3 font-mono">{formatWon(v.retailValue)}</td>
                  <td className="px-4 py-3 font-mono">{formatWon(v.extraPayment)}</td>
                  <td
                    className={`px-4 py-3 font-mono ${
                      v.status === '예정'
                        ? 'text-muted'
                        : `font-semibold ${netSaved(v) < 0 ? 'text-red-400' : 'text-green'}`
                    }`}
                  >
                    {formatWon(netSaved(v))}
                  </td>
                  <td className="py-3 pr-6 pl-4">
                    <StatusBadgeButton status={v.status} onClick={(e) => handleToggleStatus(e, v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
