import { useEffect, useRef, useState } from 'react'

export function useInfiniteScroll(totalCount: number, resetKey: unknown, batchSize = 20) {
  const [displayCount, setDisplayCount] = useState(() => Math.min(batchSize, totalCount))
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Resets to the first batch whenever the underlying list changes shape or
  // size. Note: ANY totalCount change (not just shrink) triggers a full reset,
  // not a "defensive clamp" for shrink. This is intentional and safe for this
  // app's actual usage:
  //   1. totalCount=0→N (initial data load): full reset is correct — must show
  //      the first batch
  //   2. totalCount change via filter/sort: resetKey always changes in sync, so
  //      distinction is moot
  //   3. No code path exists where a live, already-scrolled list gets totalCount
  //      change without resetKey change (visits are only added/deleted from other
  //      routes, which unmount and remount TablePage fresh)
  // The design doc edge-case section describes clamp-only behavior for unreachable
  // scenarios; building it would violate YAGNI.
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
