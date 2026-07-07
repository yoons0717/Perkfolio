import type { HTMLAttributes } from 'react'

export default function Section({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 shadow-lg shadow-black/30 ${className}`} {...props} />
  )
}
