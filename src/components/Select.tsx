import type { SelectHTMLAttributes } from 'react'

export default function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`w-full appearance-none pr-8 ${className}`} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted"
      >
        ▾
      </span>
    </div>
  )
}
