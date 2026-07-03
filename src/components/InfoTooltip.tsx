export default function InfoTooltip({ text }: { text: string }) {
  return (
    <span tabIndex={0} className="group relative inline-flex outline-none">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="10.5" x2="12" y2="16" />
        <circle cx="12" cy="7.5" r="0.5" fill="currentColor" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus:opacity-100">
        {text}
      </span>
    </span>
  )
}
