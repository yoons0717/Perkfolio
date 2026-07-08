import { supabase } from './supabaseClient'
import type { DashboardGraph, NewDashboardGraph } from '../types/dashboardGraph'

type DashboardGraphRow = {
  id: string
  axis: DashboardGraph['axis']
  chart_type: DashboardGraph['chartType']
  scope: DashboardGraph['scope']
  created_at: string
}

function toDashboardGraph(row: DashboardGraphRow): DashboardGraph {
  return {
    id: row.id,
    axis: row.axis,
    chartType: row.chart_type,
    scope: row.scope,
    createdAt: row.created_at,
  }
}

export async function getDashboardGraphs(): Promise<DashboardGraph[]> {
  const { data, error } = await supabase
    .from('dashboard_graphs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as DashboardGraphRow[]).map(toDashboardGraph)
}

export async function addDashboardGraph(graph: NewDashboardGraph): Promise<DashboardGraph> {
  const { data, error } = await supabase
    .from('dashboard_graphs')
    .insert({
      axis: graph.axis,
      chart_type: graph.chartType,
      scope: graph.scope,
    })
    .select()
    .single()

  if (error) throw error
  return toDashboardGraph(data as DashboardGraphRow)
}

export async function deleteDashboardGraph(id: string): Promise<void> {
  const { error } = await supabase.from('dashboard_graphs').delete().eq('id', id)

  if (error) throw error
}
