import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { useVisits } from '../hooks/useVisits'
import { deadlineUrgentDotClass, deadlineUrgentTextClass } from '../lib/statusStyle'
import { formatDDay } from '../lib/format'
import type { Category, Visit } from '../types/visit'

const categoryIcon: Record<Category, string> = {
  카페: '☕',
  음식점: '🍚',
  술집: '🍺',
  기타: '✨',
}

type Tab = '방문예정' | '리뷰완료'

function ListCard({ visit, onNavigate }: { visit: Visit; onNavigate: () => void }) {
  const reviewed = visit.status === '리뷰완료'

  return (
    <div
      onClick={onNavigate}
      className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-black/10 transition-colors hover:border-blue/50"
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
        <StatusBadge status={visit.status} />
      </div>

      {reviewed ? (
        <p className="text-xs font-semibold text-violet">리뷰를 작성해주셔서 감사합니다.</p>
      ) : (
        visit.reviewDeadline && (
          <p className={`flex items-center gap-1.5 text-xs ${deadlineUrgentTextClass}`}>
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${deadlineUrgentDotClass}`} />
            {`마감 ${visit.reviewDeadline} (${formatDDay(visit.reviewDeadline)})`}
          </p>
        )
      )}

      {visit.reviewDeadline && (
        <p className="border-t border-line pt-3 text-xs text-muted">{visit.reviewDeadline}까지</p>
      )}
    </div>
  )
}

export default function ListPage() {
  const navigate = useNavigate()
  const { visits, loading, error } = useVisits()
  const [tab, setTab] = useState<Tab>('방문예정')

  const { upcoming, reviewed } = useMemo(() => {
    const upcoming = visits
      .filter((v) => v.status !== '리뷰완료')
      .sort((a, b) => (a.reviewDeadline ?? '').localeCompare(b.reviewDeadline ?? ''))
    const reviewed = visits
      .filter((v) => v.status === '리뷰완료')
      .sort((a, b) => (b.reviewDeadline ?? '').localeCompare(a.reviewDeadline ?? ''))
    return { upcoming, reviewed }
  }, [visits])

  if (loading) return null
  if (error) return <p className="text-sm text-red-400">{error}</p>

  const active = tab === '방문예정' ? upcoming : reviewed

  return (
    <div>
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setTab('방문예정')}
          className={`flex-1 rounded-2xl border p-4 text-left transition-colors ${
            tab === '방문예정' ? 'border-blue bg-blue-bg' : 'border-line bg-surface'
          }`}
        >
          <p className="text-xs font-semibold text-muted">방문예정 캠페인</p>
          <p className={`mt-1 font-mono text-3xl font-extrabold ${tab === '방문예정' ? 'text-blue' : 'text-ink'}`}>
            {upcoming.length}
          </p>
        </button>
        <button
          onClick={() => setTab('리뷰완료')}
          className={`flex-1 rounded-2xl border p-4 text-left transition-colors ${
            tab === '리뷰완료' ? 'border-violet bg-violet-bg' : 'border-line bg-surface'
          }`}
        >
          <p className="text-xs font-semibold text-muted">리뷰한 캠페인</p>
          <p className={`mt-1 font-mono text-3xl font-extrabold ${tab === '리뷰완료' ? 'text-violet' : 'text-ink'}`}>
            {reviewed.length}
          </p>
        </button>
      </div>

      {active.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          {tab === '방문예정' ? '방문 예정인 캠페인이 없습니다.' : '아직 리뷰를 완료한 캠페인이 없습니다.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((v) => (
            <ListCard key={v.id} visit={v} onNavigate={() => navigate(`/edit/${v.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}
