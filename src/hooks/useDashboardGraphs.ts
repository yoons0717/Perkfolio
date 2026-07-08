import { useEffect, useState } from 'react'
import { getDashboardGraphs, addDashboardGraph, deleteDashboardGraph } from '../lib/dashboardGraphs'
import type { DashboardGraph, NewDashboardGraph } from '../types/dashboardGraph'

export function useDashboardGraphs() {
  const [graphs, setGraphs] = useState<DashboardGraph[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getDashboardGraphs()
      .then(setGraphs)
      .catch(() => setError('그래프 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  const addGraph = async (newGraph: NewDashboardGraph) => {
    await addDashboardGraph(newGraph)
    // Fetch updated list and update state
    const updated = await getDashboardGraphs()
    setGraphs(updated)
  }

  const removeGraph = async (id: string) => {
    await deleteDashboardGraph(id)
    // Update state by filtering out the deleted graph
    setGraphs((prev) => prev.filter((g) => g.id !== id))
  }

  return { graphs, loading, error, addGraph, removeGraph }
}
