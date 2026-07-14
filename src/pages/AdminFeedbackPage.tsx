import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import AdminReplyBlock from '../components/AdminReplyBlock'
import BackButton from '../components/BackButton'
import Button from '../components/Button'
import Card from '../components/Card'
import { inputClass } from '../components/formStyles'
import PageContainer from '../components/PageContainer'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'
import { useAsyncList } from '../hooks/useAsyncList'
import { isAdmin } from '../lib/admin'
import { getFeedbackList, replyToFeedback } from '../lib/feedback'
import { formatDateTime } from '../lib/format'
import { feedbackTypeLabel } from '../types/feedback'
import type { Feedback } from '../types/feedback'

function ReplySection({
  feedback,
  onReplied,
}: {
  feedback: Feedback
  onReplied: (id: string, adminReply: string, repliedAt: string) => void
}) {
  const hasReply = feedback.adminReply !== null
  const [editing, setEditing] = useState(!hasReply)
  const [draft, setDraft] = useState(feedback.adminReply ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)

    try {
      const repliedAt = new Date().toISOString()
      await replyToFeedback(feedback.id, draft)
      onReplied(feedback.id, draft, repliedAt)
      setEditing(false)
    } catch {
      setError('답변 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!editing && hasReply) {
    return (
      <div className="mt-2">
        <AdminReplyBlock reply={feedback.adminReply as string} repliedAt={feedback.repliedAt} />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="mt-2 font-normal text-muted hover:text-ink"
        >
          답변 수정
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <label className="flex flex-col gap-1 text-xs text-ink">
        답변
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </label>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      <div className="mt-2 flex gap-2">
        {hasReply && (
          <Button
            variant="secondary"
            size="sm"
            disabled={submitting}
            onClick={() => {
              setDraft(feedback.adminReply ?? '')
              setEditing(false)
            }}
          >
            취소
          </Button>
        )}
        <Button size="sm" disabled={submitting || !draft.trim()} onClick={handleSubmit}>
          {submitting ? '등록 중...' : hasReply ? '저장' : '답변 등록'}
        </Button>
      </div>
    </div>
  )
}

export default function AdminFeedbackPage() {
  const { session } = useAuth()
  const admin = isAdmin(session?.user.app_metadata)
  const {
    data: feedbackList,
    setData: setFeedbackList,
    loading,
    error,
  } = useAsyncList(getFeedbackList, [admin], { enabled: admin })

  function handleReplied(id: string, adminReply: string, repliedAt: string) {
    setFeedbackList((list) => list.map((f) => (f.id === id ? { ...f, adminReply, repliedAt } : f)))
  }

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
                    {feedbackTypeLabel[feedback.type]}
                  </span>
                  <span className="text-xs text-muted">{formatDateTime(feedback.createdAt)}</span>
                </div>
                {feedback.userEmail && <p className="mb-1 text-xs text-muted">{feedback.userEmail}</p>}
                <p className="whitespace-pre-wrap text-sm text-ink">{feedback.content}</p>
                <ReplySection feedback={feedback} onReplied={handleReplied} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}
