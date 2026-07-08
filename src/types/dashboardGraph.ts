export type DashboardGraph = {
  id: string
  axis: 'category' | 'platform' | 'month'
  chartType: 'bar' | 'line'
  scope: 'all' | 'period'
  createdAt: string
}

export type NewDashboardGraph = Pick<DashboardGraph, 'axis' | 'chartType' | 'scope'>
