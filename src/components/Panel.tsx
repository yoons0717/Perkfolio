import type { HTMLAttributes } from 'react'

export default function Panel({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-xl bg-white/5 p-4 ${className}`} {...props} />
}
