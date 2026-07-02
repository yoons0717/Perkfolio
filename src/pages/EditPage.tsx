import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import VisitForm from '../components/VisitForm'
import { sectionLabelClass } from '../components/formStyles'
import { formatWon } from '../lib/format'
import { deadlineDisplay } from '../lib/statusStyle'
import { deleteVisit, getVisit, updateVisit } from '../lib/visits'
import type { NewVisit, Visit } from '../types/visit'

const viewBoxClass = 'border-b border-line px-3 py-3 text-ink'

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

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <div className={`${viewBoxClass} font-medium`}>{value}</div>
    </div>
  )
}

function ViewLinkField({ label, href }: { label: string; href: string | null }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={`${viewBoxClass} flex items-center gap-1.5 text-blue`}
        >
          <LinkIcon />
          바로가기
        </a>
      ) : (
        <div className={`${viewBoxClass} text-muted`}>없음</div>
      )}
    </div>
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
    if (!window.confirm('이 방문 기록을 삭제할까요?')) return
    try {
      await deleteVisit(id)
      navigate('/table')
    } catch (err) {
      console.error(err)
      setDeleteError('삭제에 실패했습니다.')
    }
  }

  if (loadError) {
    return <p className="mx-auto mt-10 max-w-lg px-4 text-sm text-red-400">기록을 불러오지 못했습니다.</p>
  }

  if (!visit) {
    return null
  }

  if (mode === 'edit') {
    const initialValues: NewVisit = {
      visitDate: visit.visitDate,
      platform: visit.platform,
      storeName: visit.storeName,
      category: visit.category,
      sponsoredItems: visit.sponsoredItems,
      campaignUrl: visit.campaignUrl,
      storeInfoUrl: visit.storeInfoUrl,
      retailValue: visit.retailValue,
      extraPayment: visit.extraPayment,
      status: visit.status,
      postUrl: visit.postUrl,
      reviewDeadline: visit.reviewDeadline,
    }

    return (
      <PageContainer>
        <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">방문 기록 수정</h1>
        <VisitForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="저장"
          pendingLabel="저장 중..."
          footerExtra={
            <button
              type="button"
              onClick={() => setMode('view')}
              className="rounded-lg border border-line px-3 py-2 text-sm text-muted"
            >
              취소
            </button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">{visit.storeName}</h1>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <ViewField label="방문일" value={visit.visitDate} />
            <ViewField label="플랫폼" value={visit.platform} />
          </div>

          <ViewField
            label="리뷰 마감일"
            value={
              !visit.reviewDeadline
                ? '없음'
                : `${visit.reviewDeadline} (${deadlineDisplay(visit.status, visit.reviewDeadline)?.text})`
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <ViewField label="업체명" value={visit.storeName} />
            <ViewField label="카테고리" value={visit.category} />
          </div>

          <ViewLinkField label="가게 정보 URL" href={visit.storeInfoUrl} />
          <ViewField label="체험 내역" value={visit.sponsoredItems} />

          <div className="grid grid-cols-2 gap-3">
            <ViewField label="정가" value={formatWon(visit.retailValue)} />
            <ViewField label="추가 결제액" value={formatWon(visit.extraPayment)} />
          </div>

          <ViewField label="상태" value={visit.status} />
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-6">
          <p className={sectionLabelClass}>링크</p>
          <ViewLinkField label="체험단 URL" href={visit.campaignUrl} />
          <ViewLinkField label="포스팅 링크" href={visit.postUrl} />
        </div>
      </div>

      {deleteError && <p className="mt-3 text-sm text-red-400">{deleteError}</p>}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className="flex-1 rounded-lg bg-blue px-3 py-2 font-display text-sm font-bold text-white"
        >
          수정
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg border border-line px-3 py-2 text-sm text-red-400"
        >
          삭제
        </button>
      </div>
    </PageContainer>
  )
}
