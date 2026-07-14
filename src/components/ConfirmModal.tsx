import { useState } from 'react'
import Button from './Button'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

export default function ConfirmModal({
  title,
  description,
  confirmLabel,
  pendingLabel,
  errorFallback,
  onConfirm,
  onClose,
}: {
  title: string
  description: string
  confirmLabel: string
  pendingLabel: string
  errorFallback: string
  onConfirm: () => Promise<void>
  onClose: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useBodyScrollLock()

  async function handleConfirm() {
    setError(null)
    setSubmitting(true)

    try {
      await onConfirm()
    } catch (err) {
      setError(err instanceof Error ? err.message : errorFallback)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-display text-xl font-extrabold text-ink">{title}</h2>
        <p className="mb-6 text-sm text-ink">{description}</p>
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" disabled={submitting} onClick={onClose} className="flex-1">
            취소
          </Button>
          <Button type="button" variant="danger" disabled={submitting} onClick={handleConfirm} className="flex-1">
            {submitting ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
