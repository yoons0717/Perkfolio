import type { ComponentProps } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatWon } from '../lib/format'
import type { DashboardGraph } from '../types/dashboardGraph'

export type GraphDatum = { label: string; avgNet: number; totalNet: number; count: number }

function formatMetric(metric: DashboardGraph['metric'], datum: GraphDatum): string {
  if (metric === 'count') return `${datum.count}건`
  const value = metric === 'totalNet' ? datum.totalNet : datum.avgNet
  return datum.count === 0 ? '-' : formatWon(value)
}

function metricValue(metric: DashboardGraph['metric'], datum: GraphDatum): number {
  if (metric === 'count') return datum.count
  return metric === 'totalNet' ? datum.totalNet : datum.avgNet
}

function ChartGrid() {
  return <CartesianGrid stroke="var(--color-line)" vertical={false} />
}

function ChartXAxis() {
  return (
    <XAxis
      dataKey="label"
      tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
      axisLine={{ stroke: 'var(--color-line)' }}
      tickLine={false}
    />
  )
}

function ChartYAxis() {
  return (
    <YAxis
      tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
      axisLine={false}
      tickLine={false}
      tickFormatter={(value: number) => value.toLocaleString('ko-KR')}
    />
  )
}

function ChartTooltip({ cursor }: { cursor: ComponentProps<typeof Tooltip>['cursor'] }) {
  return (
    <Tooltip
      cursor={cursor}
      wrapperStyle={{ zIndex: 10 }}
      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 8 }}
      labelStyle={{ color: 'var(--color-ink)' }}
      itemStyle={{ color: 'var(--color-ink)' }}
      formatter={(value) => formatWon(Number(value))}
    />
  )
}

export default function GraphChart({
  data,
  chartType,
  metric,
}: {
  data: GraphDatum[]
  chartType: DashboardGraph['chartType']
  metric: DashboardGraph['metric']
}) {
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(metricValue(metric, d))))

  if (data.length === 0) {
    return <p className="text-sm text-muted">아직 데이터가 없습니다.</p>
  }

  if (chartType === 'line') {
    const dataKey = metric === 'count' ? 'count' : metric === 'totalNet' ? 'totalNet' : 'avgNet'
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <ChartGrid />
          <ChartXAxis />
          <ChartYAxis />
          <ChartTooltip cursor={{ stroke: 'var(--color-line)' }} />
          <Line
            type="monotone"
            dataKey={dataKey}
            name="값"
            stroke="var(--color-blue)"
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((datum) => {
        const { label, avgNet, count } = datum
        const value = metricValue(metric, datum)
        const isNegative = metric !== 'count' && avgNet < 0
        return (
          <div key={label} className="flex items-center gap-2 text-sm">
            <span className="w-24 shrink-0 truncate text-muted">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full ${isNegative ? 'bg-danger' : 'bg-blue'}`}
                style={{ width: `${(Math.abs(value) / maxAbs) * 100}%` }}
              />
            </div>
            <span
              className={`w-20 shrink-0 text-right font-mono text-xs font-semibold ${isNegative ? 'text-danger' : 'text-blue'}`}
            >
              {formatMetric(metric, datum)}
            </span>
            {metric !== 'count' && <span className="w-8 shrink-0 text-right font-mono text-xs text-muted">{count}건</span>}
          </div>
        )
      })}
    </div>
  )
}
