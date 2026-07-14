import { useMemo, useState } from 'react'
import Button from './Button'
import GraphChart from './GraphChart'
import Panel from './Panel'
import Select from './Select'
import { selectClass } from './formStyles'
import { computeGraphData, visitsForGraphScope } from '../lib/visitStats'
import type { NewDashboardGraph } from '../types/dashboardGraph'
import type { Visit } from '../types/visit'

type Axis = NewDashboardGraph['axis']
type ChartType = NewDashboardGraph['chartType']
type Scope = NewDashboardGraph['scope']
type Metric = NewDashboardGraph['metric']

const scopeOptions: { value: Scope; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'thisMonth', label: '이번 달' },
  { value: 'lastMonth', label: '지난달' },
  { value: 'thisYear', label: '올해' },
  { value: 'lastYear', label: '작년' },
]

const metricOptions: { value: Metric; label: string }[] = [
  { value: 'avgNet', label: '평균 절감액' },
  { value: 'totalNet', label: '총 절감액' },
  { value: 'count', label: '건수' },
]

const axisLabel: Record<Axis, string> = {
  category: '카테고리별',
  platform: '플랫폼별',
  month: '월별',
}

// 셀렉트와 "고정" 안내 자리의 높이/여백을 맞춰 축 전환 시 레이아웃이 흔들리지 않게 한다.
const fixedFieldClass = `${selectClass} border-dashed text-center text-muted`

export default function GraphBuilderForm({
  onSave,
  previewVisits,
}: {
  onSave: (g: NewDashboardGraph) => void
  previewVisits: Visit[]
}) {
  const [axis, setAxis] = useState<Axis>('category')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [scope, setScope] = useState<Scope>('all')
  const [metric, setMetric] = useState<Metric>('avgNet')

  // axis=month: chartType(막대/라인) 선택 가능, scope는 항상 'all' 고정.
  // axis=category/platform: chartType은 항상 'bar' 고정, scope(전체/이번 달/지난달/올해/작년) 선택 가능.
  const isMonth = axis === 'month'
  const effectiveScope = isMonth ? 'all' : scope
  const effectiveChartType = isMonth ? chartType : 'bar'

  const previewData = useMemo(
    () => computeGraphData(visitsForGraphScope(effectiveScope, previewVisits), axis),
    [previewVisits, effectiveScope, axis],
  )

  function handleAxisChange(next: Axis) {
    setAxis(next)
    if (next === 'month') {
      setScope('all')
    } else {
      setChartType('bar')
    }
  }

  function handleSave() {
    onSave({
      axis,
      chartType: effectiveChartType,
      scope: effectiveScope,
      metric,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex w-36 flex-col gap-1.5 text-sm text-ink">
          축 (그룹 기준)
          <Select
            aria-label="축"
            value={axis}
            onChange={(e) => handleAxisChange(e.target.value as Axis)}
            className={selectClass}
          >
            <option value="category">카테고리</option>
            <option value="platform">플랫폼</option>
            <option value="month">월</option>
          </Select>
        </label>

        <label className="flex w-32 flex-col gap-1.5 text-sm text-ink">
          지표
          <Select
            aria-label="지표"
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className={selectClass}
          >
            {metricOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>

        {isMonth ? (
          <label className="flex w-32 flex-col gap-1.5 text-sm text-ink">
            차트 종류
            <Select
              aria-label="차트 종류"
              value={chartType}
              onChange={(e) => setChartType(e.target.value as ChartType)}
              className={selectClass}
            >
              <option value="bar">막대</option>
              <option value="line">라인</option>
            </Select>
          </label>
        ) : (
          <div className="flex w-32 flex-col gap-1.5 text-sm text-ink">
            차트 종류
            <p className={fixedFieldClass}>막대 고정</p>
          </div>
        )}

        {isMonth ? (
          <div className="flex w-32 flex-col gap-1.5 text-sm text-ink">
            기간
            <p className={fixedFieldClass}>전체 고정</p>
          </div>
        ) : (
          <label className="flex w-32 flex-col gap-1.5 text-sm text-ink">
            기간
            <Select
              aria-label="기간"
              value={scope}
              onChange={(e) => setScope(e.target.value as Scope)}
              className={selectClass}
            >
              {scopeOptions.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
        )}

        <Button onClick={handleSave}>저장</Button>
      </div>

      <Panel>
        <p className="mb-3 font-display text-sm font-bold text-ink">
          미리보기 · {axisLabel[axis]} {metricOptions.find((o) => o.value === metric)?.label}
        </p>
        <GraphChart data={previewData} chartType={effectiveChartType} metric={metric} />
      </Panel>
    </div>
  )
}
