import { useState } from 'react'
import Button from './Button'
import FeedbackModal from './FeedbackModal'
import { useAuth } from '../context/AuthContext'

export default function Footer() {
  const { session, isPasswordRecovery } = useAuth()
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  if (!session || isPasswordRecovery) return null

  return (
    <footer className="border-t border-line bg-surface px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-muted">
        <p>© 2026 PerkTrack</p>
        <Button
          variant="ghost"
          onClick={() => setIsFeedbackOpen(true)}
          className="font-normal text-muted hover:text-ink"
        >
          문의하기
        </Button>
      </div>
      {isFeedbackOpen && <FeedbackModal onClose={() => setIsFeedbackOpen(false)} />}
    </footer>
  )
}
