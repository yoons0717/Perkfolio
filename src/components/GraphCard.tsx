import Button from './Button'
import GraphChart from './GraphChart'
import Panel from './Panel'
import type { GraphDatum } from './GraphChart'
import type { DashboardGraph } from '../types/dashboardGraph'

const axisLabel: Record<DashboardGraph['axis'], string> = {
  category: '카테고리별',
  platform: '플랫폼별',
  month: '월별',
}

const scopeLabel: Record<DashboardGraph['scope'], string> = {
  all: '전체',
  thisMonth: '이번 달',
  lastMonth: '지난달',
  thisYear: '올해',
  lastYear: '작년',
}

const metricLabel: Record<DashboardGraph['metric'], string> = {
  avgNet: '평균 절감액',
  totalNet: '총 절감액',
  count: '건수',
}

export default function GraphCard({
  graph,
  data,
  onDelete,
}: {
  graph: DashboardGraph
  data: GraphDatum[]
  onDelete: () => void
}) {
  return (
    <Panel>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-sm font-bold text-ink">
            {axisLabel[graph.axis]} {metricLabel[graph.metric]}
          </p>
          {graph.axis !== 'month' && <p className="text-xs text-muted">{scopeLabel[graph.scope]} 기준</p>}
        </div>
        <Button variant="danger" size="sm" onClick={onDelete}>
          삭제
        </Button>
      </div>

      <GraphChart data={data} chartType={graph.chartType} metric={graph.metric} />
    </Panel>
  )
}
