import { useState } from 'react'
import Button from './Button'
import { markOnboardingSeen } from '../lib/auth'

const steps = [
  '+ 버튼으로 체험단을 추가해보세요',
  '표·캘린더에서 방문 내역을 확인하세요',
  '대시보드에서 절감액 통계를 확인하세요',
]

export default function WelcomeModal({ onDismiss }: { onDismiss: () => void }) {
  const [submitting, setSubmitting] = useState(false)

  async function handleStart() {
    setSubmitting(true)
    try {
      await markOnboardingSeen()
    } catch (err) {
      console.error(err)
    }
    onDismiss()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-6">
        <h2 className="mb-2 font-display text-xl font-extrabold text-ink">PerkTrack에 오신 걸 환영해요</h2>
        <p className="mb-5 text-sm text-muted">이렇게 시작해보세요.</p>
        <ul className="mb-6 flex flex-col gap-2 text-sm text-ink">
          {steps.map((step) => (
            <li key={step} className="flex gap-2">
              <span className="text-blue">·</span>
              {step}
            </li>
          ))}
        </ul>
        <Button onClick={handleStart} disabled={submitting} className="w-full">
          시작하기
        </Button>
      </div>
    </div>
  )
}
