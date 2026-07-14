import { useAsyncList } from './useAsyncList'
import { getVisits } from '../lib/visits'

export function useVisits() {
  const { data: visits, loading, error } = useAsyncList(getVisits, [])
  return { visits, loading, error }
}
