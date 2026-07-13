import { useEffect, useState } from 'react'
import Button from './Button'
import { deleteAccount } from '../lib/auth'

export default function DeleteAccountModal({
  onClose,
  onDeleted,
}: {
  onClose: () => void
  onDeleted: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  async function handleConfirm() {
    setError(null)
    setSubmitting(true)

    try {
      await deleteAccount()
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원 탈퇴에 실패했습니다. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-display text-xl font-extrabold text-ink">회원 탈퇴</h2>
        <p className="mb-6 text-sm text-ink">
          정말 탈퇴하시겠어요? 모든 데이터가 삭제되며 복구할 수 없습니다.
        </p>
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button type="button" variant="danger" disabled={submitting} onClick={handleConfirm} className="flex-1">
            {submitting ? '탈퇴 중...' : '탈퇴하기'}
          </Button>
        </div>
      </div>
    </div>
  )
}
