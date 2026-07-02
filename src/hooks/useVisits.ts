import { useEffect, useState } from 'react'
import { getVisits } from '../lib/visits'
import type { Visit } from '../types/visit'

export function useVisits() {
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getVisits()
      .then(setVisits)
      .catch(() => setError('목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  return { visits, setVisits, loading, error }
}
