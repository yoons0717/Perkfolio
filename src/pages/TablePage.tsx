import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from '../components/Select'
import StatusBadgeButton from '../components/StatusBadgeButton'
import { useVisitActions } from '../hooks/useVisitActions'
import { formatWon } from '../lib/format'
import { deadlineDisplay, statusOrder } from '../lib/statusStyle'
import { getVisits } from '../lib/visits'
import { platforms } from '../types/visit'
import type { Platform, Visit, VisitStatus } from '../types/visit'

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
  { key: 'visitDate', label: '날짜' },
  { key: 'reviewDeadline', label: '마감일' },
  { key: 'platform', label: '플랫폼' },
  { key: 'storeName', label: '업체명' },
  { key: 'category', label: '카테고리' },
  { key: 'retailValue', label: '체험가' },
  { key: 'extraPayment', label: '추가결제' },
  { key: 'netSaved', label: '순절감액' },
]

function netSaved(v: Visit): number {
  return v.retailValue - v.extraPayment
}

function sortValue(v: Visit, key: SortKey): string | number {
  if (key === 'netSaved') return netSaved(v)
  if (key === 'reviewDeadline') return v.reviewDeadline ?? ''
  return v[key]
}

export default function TablePage() {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { actionError, handleToggleStatus, handleDelete } = useVisitActions(setVisits)
  const [statusFilter, setStatusFilter] = useState<'전체' | VisitStatus>('전체')
  const [platformFilter, setPlatformFilter] = useState<'전체' | Platform>('전체')
  const [sortKey, setSortKey] = useState<SortKey>('visitDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    getVisits()
      .then(setVisits)
      .catch(() => setError('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

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
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[860px] border-collapse whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-muted">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer select-none px-4 py-3 font-semibold"
                  >
                    {col.label}
                    {sortKey === col.key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold">상태</th>
                <th className="px-4 py-3"></th>
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
                    {(() => {
                      const deadline = deadlineDisplay(v.status, v.reviewDeadline)
                      if (!deadline) return <span className="text-muted">-</span>
                      if (deadline.reviewed) return <span className="text-green">{deadline.text}</span>
                      return (
                        <span className="text-red-400">
                          {v.reviewDeadline} <span className="text-[10px] text-muted">({deadline.text})</span>
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3">{v.platform}</td>
                  <td className="px-4 py-3">{v.storeName}</td>
                  <td className="px-4 py-3">{v.category}</td>
                  <td className="px-4 py-3 font-mono">{formatWon(v.retailValue)}</td>
                  <td className="px-4 py-3 font-mono">{formatWon(v.extraPayment)}</td>
                  <td
                    className={`px-4 py-3 font-mono font-semibold ${netSaved(v) < 0 ? 'text-red-400' : 'text-green'}`}
                  >
                    {formatWon(netSaved(v))}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadgeButton status={v.status} onClick={(e) => handleToggleStatus(e, v)} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, v, `"${v.storeName}" 기록을 삭제할까요?`)}
                      className="text-xs text-muted hover:text-red-400"
                    >
                      삭제
                    </button>
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
