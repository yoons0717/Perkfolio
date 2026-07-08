import type { ComponentProps } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Button from './Button'
import Panel from './Panel'
import { formatWon } from '../lib/format'
import type { DashboardGraph } from '../types/dashboardGraph'

type GraphDatum = { label: string; avgNet: number; count: number }

const axisLabel: Record<DashboardGraph['axis'], string> = {
  category: '카테고리별',
  platform: '플랫폼별',
  month: '월별',
}

const scopeLabel: Record<DashboardGraph['scope'], string> = {
  all: '전체',
  period: '이번 달',
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

export default function GraphCard({
  graph,
  data,
  onDelete,
}: {
  graph: DashboardGraph
  data: GraphDatum[]
  onDelete: () => void
}) {
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.avgNet)))

  return (
    <Panel>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-sm font-bold text-ink">{axisLabel[graph.axis]} 평균 절감액</p>
          {graph.axis !== 'month' && <p className="text-xs text-muted">{scopeLabel[graph.scope]} 기준</p>}
        </div>
        <Button variant="danger" size="sm" onClick={onDelete}>
          삭제
        </Button>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-muted">아직 데이터가 없습니다.</p>
      ) : graph.chartType === 'line' ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <ChartGrid />
            <ChartXAxis />
            <ChartYAxis />
            <ChartTooltip cursor={{ stroke: 'var(--color-line)' }} />
            <Line
              type="monotone"
              dataKey="avgNet"
              name="평균 절감액"
              stroke="var(--color-blue)"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map(({ label, avgNet, count }) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <span className="w-24 shrink-0 truncate text-muted">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${avgNet < 0 ? 'bg-danger' : 'bg-blue'}`}
                  style={{ width: `${(Math.abs(avgNet) / maxAbs) * 100}%` }}
                />
              </div>
              <span
                className={`w-20 shrink-0 text-right font-mono text-xs font-semibold ${avgNet < 0 ? 'text-danger' : 'text-blue'}`}
              >
                {formatWon(avgNet)}
              </span>
              <span className="w-8 shrink-0 text-right font-mono text-xs text-muted">{count}건</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
