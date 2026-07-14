import { useState } from 'react'
import AdminReplyBlock from './AdminReplyBlock'
import Button from './Button'
import Card from './Card'
import ConfirmModal from './ConfirmModal'
import Spinner from './Spinner'
import { useAuth } from '../context/AuthContext'
import { useAsyncList } from '../hooks/useAsyncList'
import { deleteFeedback, getMyFeedbackList } from '../lib/feedback'
import { formatDate } from '../lib/format'
import { feedbackTypeLabel } from '../types/feedback'

export default function MyFeedbackCard() {
  const { session } = useAuth()
  const userId = session?.user.id
  const {
    data: feedbackList,
    setData: setFeedbackList,
    loading,
    error,
  } = useAsyncList(() => getMyFeedbackList(userId as string), [userId], { enabled: !!userId })
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!session || !userId) return null

  let content
  if (error) {
    content = <p className="text-sm text-danger">{error}</p>
  } else if (loading) {
    content = <Spinner />
  } else if (feedbackList.length === 0) {
    content = <p className="text-sm text-muted">아직 제출한 문의가 없어요.</p>
  } else {
    content = (
      <ul className="flex flex-col gap-3">
        {feedbackList.map((feedback) => (
          <li key={feedback.id} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-overlay px-3 py-1 font-mono text-xs text-ink">
                {feedbackTypeLabel[feedback.type]}
              </span>
              <span className="text-xs text-muted">{formatDate(feedback.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink">{feedback.content}</p>
            {feedback.adminReply !== null ? (
              <div className="mt-2">
                <AdminReplyBlock reply={feedback.adminReply} repliedAt={feedback.repliedAt} />
              </div>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted">아직 답변이 없습니다.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingId(feedback.id)}
                  className="mt-2 font-normal text-muted hover:text-danger"
                >
                  삭제
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <Card>
      <h2 className="mb-2 font-display text-sm font-bold text-ink">내 문의내역</h2>
      {content}
      {deletingId && (
        <ConfirmModal
          title="문의 삭제"
          description="삭제하면 되돌릴 수 없습니다. 정말 삭제하시겠어요?"
          confirmLabel="삭제하기"
          pendingLabel="삭제 중..."
          errorFallback="삭제에 실패했습니다. 다시 시도해주세요."
          onClose={() => setDeletingId(null)}
          onConfirm={async () => {
            await deleteFeedback(deletingId)
            setFeedbackList((list) => list.filter((f) => f.id !== deletingId))
            setDeletingId(null)
          }}
        />
      )}
    </Card>
  )
}
