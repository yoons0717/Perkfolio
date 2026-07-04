import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import PageContainer from '../components/PageContainer'
import StatusBadge from '../components/StatusBadge'
import VisitForm from '../components/VisitForm'
import { sectionLabelClass } from '../components/formStyles'
import { formatWon } from '../lib/format'
import { deadlineDisplay } from '../lib/statusStyle'
import { confirmAndDelete } from '../hooks/useVisitActions'
import { getVisit, updateVisit } from '../lib/visits'
import type { NewVisit, Visit } from '../types/visit'

const viewBoxClass = 'border-b border-line px-3 py-2 text-ink'

function LinkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <div className={`${viewBoxClass} font-medium`}>{value}</div>
    </div>
  )
}

function LinkChip({ label, href }: { label: string; href: string | null }) {
  if (!href) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-blue-bg px-3 py-1.5 text-xs font-semibold text-blue transition-colors hover:bg-blue/20"
    >
      <LinkIcon />
      {label}
    </a>
  )
}

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<Visit | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoadError(false)
    getVisit(id)
      .then((v) => {
        if (!cancelled) setVisit(v)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleSubmit(updated: NewVisit) {
    if (!id) return
    const saved = await updateVisit(id, updated)
    setVisit(saved)
    setMode('view')
  }

  async function handleDelete() {
    if (!id) return
    await confirmAndDelete(id, '이 방문 기록을 삭제할까요?', () => navigate('/table'), setDeleteError)
  }

  if (loadError) {
    return <p className="mx-auto mt-10 max-w-lg px-4 text-sm text-red-400">기록을 불러오지 못했습니다.</p>
  }

  if (!visit) {
    return null
  }

  if (mode === 'edit') {
    return (
      <PageContainer>
        <div className="mb-4 flex items-center gap-3">
          <BackButton />
          <h1 className="font-display text-2xl font-extrabold text-ink">{visit.storeName}</h1>
          <span className="rounded-full bg-line px-2 py-0.5 font-mono text-xs text-muted">수정 중</span>
        </div>
        <VisitForm
          initialValues={visit}
          onSubmit={handleSubmit}
          submitLabel="저장"
          pendingLabel="저장 중..."
          footerExtra={
            <Button variant="secondary" onClick={() => setMode('view')} className="text-muted">
              취소
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="font-display text-2xl font-extrabold text-ink">{visit.storeName}</h1>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <ViewField label="방문(예정)일" value={visit.visitDate} />
            <ViewField label="플랫폼" value={visit.platform} />
          </div>

          <ViewField
            label="마감일"
            value={
              !visit.reviewDeadline
                ? '없음'
                : `${visit.reviewDeadline} (${
                    visit.status === '리뷰완료' ? '완료' : deadlineDisplay(visit.status, visit.reviewDeadline)?.text
                  })`
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <ViewField label="업체명" value={visit.storeName} />
            <ViewField label="카테고리" value={visit.category} />
          </div>

          <ViewField label="체험 내역" value={visit.sponsoredItems} />

          <div className="grid grid-cols-2 gap-3">
            <ViewField label="체험가" value={formatWon(visit.retailValue)} />
            <ViewField label="추가결제액" value={formatWon(visit.extraPayment)} />
          </div>

          <div className="flex flex-col items-start gap-1 text-sm">
            <span className="text-muted">상태</span>
            <StatusBadge status={visit.status} />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-3">
          <p className={sectionLabelClass}>링크</p>
          <div className="flex flex-wrap gap-2">
            <LinkChip label="가게정보" href={visit.storeInfoUrl} />
            <LinkChip label="체험단" href={visit.campaignUrl} />
            <LinkChip label="포스팅" href={visit.postUrl} />
          </div>
        </div>
      </div>

      {deleteError && <p className="mt-3 text-sm text-red-400">{deleteError}</p>}

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => setMode('edit')} className="flex-1">
          수정
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          className="inline-flex items-center gap-1.5"
        >
          <TrashIcon />
          삭제
        </Button>
      </div>
    </PageContainer>
  )
}
