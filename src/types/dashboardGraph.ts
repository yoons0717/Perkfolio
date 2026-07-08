export type DashboardGraph = {
  id: string
  axis: 'category' | 'platform' | 'month'
  chartType: 'bar' | 'line'
  scope: 'all' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'
  createdAt: string
}

export type NewDashboardGraph = Pick<DashboardGraph, 'axis' | 'chartType' | 'scope'>
