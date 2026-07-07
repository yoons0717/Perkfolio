import { Link } from 'react-router-dom'
import type { FallbackProps } from 'react-error-boundary'
import Button from './Button'

export default function ErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="mx-auto mt-24 flex w-full max-w-sm flex-col items-center gap-4 px-4 text-center">
      <h1 className="font-display text-xl font-extrabold text-ink">문제가 발생했습니다</h1>
      <p className="text-sm text-muted">잠시 후 다시 시도해주세요.</p>
      <Button onClick={resetErrorBoundary} className="w-full">
        다시 시도
      </Button>
      <Link to="/table" onClick={resetErrorBoundary} className="text-sm text-blue">
        체험단 내역으로
      </Link>
    </div>
  )
}
