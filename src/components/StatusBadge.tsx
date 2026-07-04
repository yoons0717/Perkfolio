import { statusBadgeClass } from '../lib/statusStyle'
import type { VisitStatus } from '../types/visit'

type Props = {
  status: VisitStatus
}

export default function StatusBadge({ status }: Props) {
  return <span className={`rounded-full px-3 py-1 font-mono text-xs ${statusBadgeClass(status)}`}>{status}</span>
}
