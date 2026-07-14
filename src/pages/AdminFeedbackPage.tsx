import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import Card from '../components/Card'
import PageContainer from '../components/PageContainer'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../lib/admin'
import { getFeedbackList } from '../lib/feedback'
import type { Feedback } from '../types/feedback'

const typeLabel: Record<Feedback['type'], string> = {
  버그: '버그 제보',
  건의: '건의사항',
}

export default function AdminFeedbackPage() {
  const { session } = useAuth()
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const admin = isAdmin(session?.user.app_metadata)

  useEffect(() => {
    if (!admin) {
      setLoading(false)
      return
    }

    let cancelled = false
    getFeedbackList()
      .then((list) => {
        if (!cancelled) setFeedbackList(list)
      })
      .catch(() => {
        if (!cancelled) setError('목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [admin])

  if (!admin) return <Navigate to="/table" replace />
  if (loading) return <Spinner />
  if (error) return <p className="text-sm text-danger">{error}</p>

  return (
    <PageContainer>
      <div className="mb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="font-display text-2xl font-extrabold text-ink">문의/버그 제보</h1>
      </div>
      {feedbackList.length === 0 ? (
        <p className="text-sm text-muted">아직 접수된 내용이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {feedbackList.map((feedback) => (
            <li key={feedback.id}>
              <Card>
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-overlay px-3 py-1 font-mono text-xs text-ink">
                    {typeLabel[feedback.type]}
                  </span>
                  <span className="text-xs text-muted">
                    {new Date(feedback.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink">{feedback.content}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}
