import { useEffect, useState } from 'react'

export function useAsyncList<T>(
  fetcher: () => Promise<T[]>,
  deps: unknown[],
  options: { enabled?: boolean; errorMessage?: string } = {},
) {
  const { enabled = true, errorMessage = '목록을 불러오지 못했습니다.' } = options
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetcher()
      .then((list) => {
        if (!cancelled) setData(list)
      })
      .catch(() => {
        if (!cancelled) setError(errorMessage)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps])

  return { data, setData, loading, error }
}
