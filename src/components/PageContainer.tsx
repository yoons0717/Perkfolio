import type { ReactNode } from 'react'

export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto mt-6 mb-6 w-full max-w-lg px-4">{children}</div>
}
