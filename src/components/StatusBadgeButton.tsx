import { statusBadgeClass } from '../lib/statusStyle'
import type { VisitStatus } from '../types/visit'

type Props = {
  status: VisitStatus
  onClick: (e: React.MouseEvent) => void
}

export default function StatusBadgeButton({ status, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 font-mono text-xs ${statusBadgeClass(status)}`}
    >
      {status}
    </button>
  )
}
