import type { ReactNode } from 'react'

export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto mt-10 mb-10 w-full max-w-lg px-4">{children}</div>
}
