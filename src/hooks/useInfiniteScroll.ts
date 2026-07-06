import { useEffect, useRef, useState } from 'react'

export function useInfiniteScroll(totalCount: number, resetKey: unknown, batchSize = 20) {
  const [displayCount, setDisplayCount] = useState(() => Math.min(batchSize, totalCount))
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Resets to the first batch whenever the underlying list changes shape:
  // either the initial fetch just resolved (totalCount moves from 0 to N,
  // since the caller mounts this hook before its data has loaded) or the
  // caller's filter/sort changed (resetKey).
  useEffect(() => {
    setDisplayCount(Math.min(batchSize, totalCount))
  }, [resetKey, totalCount, batchSize])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setDisplayCount((count) => Math.min(count + batchSize, totalCount))
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [totalCount, batchSize])

  return { displayCount, sentinelRef }
}
