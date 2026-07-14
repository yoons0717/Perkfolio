import { formatDate } from '../lib/format'

export default function AdminReplyBlock({ reply, repliedAt }: { reply: string; repliedAt: string | null }) {
  return (
    <div className="rounded-lg bg-overlay p-3">
      <span className="mb-1 block text-xs font-bold text-muted">
        관리자 답변
        {repliedAt && ` · ${formatDate(repliedAt)}`}
      </span>
      <p className="whitespace-pre-wrap text-sm text-ink">{reply}</p>
    </div>
  )
}
