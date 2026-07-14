import { useState } from 'react'
import type { FormEvent } from 'react'
import Button from './Button'
import Select from './Select'
import { inputClass, selectClass } from './formStyles'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useAuth } from '../context/AuthContext'
import { addFeedback } from '../lib/feedback'
import type { FeedbackType } from '../types/feedback'

export default function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { session } = useAuth()
  const [type, setType] = useState<FeedbackType>('버그')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useBodyScrollLock()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await addFeedback({ type, content, userEmail: session?.user.email ?? null })
      setSubmitted(true)
    } catch {
      setError('제출에 실패했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">
          <p className="mb-6 text-sm text-ink">제출되었습니다. 감사합니다!</p>
          <Button onClick={onClose} className="w-full">
            닫기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-display text-xl font-extrabold text-ink">문의하기</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm text-ink">
            유형
            <Select
              aria-label="유형"
              value={type}
              onChange={(e) => setType(e.target.value as FeedbackType)}
              className={selectClass}
            >
              <option value="버그">버그 제보</option>
              <option value="건의">건의사항</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-ink">
            내용
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              className={inputClass}
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" disabled={submitting} onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? '제출 중...' : '제출'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
