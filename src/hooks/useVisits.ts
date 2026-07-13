import { useEffect, useState } from 'react'
import { getVisits } from '../lib/visits'
import type { Visit } from '../types/visit'

export function useVisits() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getVisits()
      .then((v) => {
        if (!cancelled) setVisits(v)
      })
      .catch(() => {
        if (!cancelled) setError('목록을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { visits, loading, error }
}
