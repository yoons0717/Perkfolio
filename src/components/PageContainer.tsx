import type { ReactNode } from 'react'

export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto mt-6 w-full max-w-lg px-4 pb-24">{children}</div>
}
