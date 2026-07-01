import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import VisitForm from '../components/VisitForm'
import { deleteVisit, getVisit, updateVisit } from '../lib/visits'
import type { NewVisit, Visit } from '../types/visit'

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<Visit | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    if (!id) return
    getVisit(id)
      .then(setVisit)
      .catch(() => setLoadError(true))
  }, [id])

  async function handleSubmit(updated: NewVisit) {
    if (!id) return
    await updateVisit(id, updated)
    navigate('/table')
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm('이 방문 기록을 삭제할까요?')) return
    await deleteVisit(id)
    navigate('/table')
  }

  if (loadError) {
    return <p className="mx-auto mt-10 max-w-md px-4 text-sm text-red-400">기록을 불러오지 못했습니다.</p>
  }

  if (!visit) {
    return null
  }

  const initialValues: NewVisit = {
    visitDate: visit.visitDate,
    platform: visit.platform,
    storeName: visit.storeName,
    category: visit.category,
    sponsoredItems: visit.sponsoredItems,
    retailValue: visit.retailValue,
    extraPayment: visit.extraPayment,
    status: visit.status,
    postUrl: visit.postUrl,
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md px-4">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">방문 기록 수정</h1>
      <VisitForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitLabel="수정"
        pendingLabel="수정 중..."
        footerExtra={
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-line px-3 py-2 text-sm text-red-400"
          >
            삭제
          </button>
        }
      />
    </div>
  )
}
