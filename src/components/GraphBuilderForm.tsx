import { useState } from 'react'
import Button from './Button'
import Select from './Select'
import { selectClass } from './formStyles'
import type { NewDashboardGraph } from '../types/dashboardGraph'

type Axis = NewDashboardGraph['axis']
type ChartType = NewDashboardGraph['chartType']
type Scope = NewDashboardGraph['scope']

export default function GraphBuilderForm({ onSave }: { onSave: (g: NewDashboardGraph) => void }) {
  const [axis, setAxis] = useState<Axis>('category')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [scope, setScope] = useState<Scope>('all')

  // axis=month: chartType(막대/라인) 선택 가능, scope는 항상 'all' 고정.
  // axis=category/platform: chartType은 항상 'bar' 고정, scope(전체/이번 달) 선택 가능.
  const isMonth = axis === 'month'

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
      chartType: isMonth ? chartType : 'bar',
      scope: isMonth ? 'all' : scope,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-ink">
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

      {isMonth ? (
        <label className="flex flex-col gap-1 text-sm text-ink">
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
        <div className="flex flex-col gap-1 text-sm text-ink">
          차트 종류
          <p className="text-xs text-muted">막대 고정</p>
        </div>
      )}

      {isMonth ? (
        <div className="flex flex-col gap-1 text-sm text-ink">
          기간
          <p className="text-xs text-muted">전체 고정</p>
        </div>
      ) : (
        <label className="flex flex-col gap-1 text-sm text-ink">
          기간
          <Select
            aria-label="기간"
            value={scope}
            onChange={(e) => setScope(e.target.value as Scope)}
            className={selectClass}
          >
            <option value="all">전체</option>
            <option value="period">이번 달</option>
          </Select>
        </label>
      )}

      <Button onClick={handleSave}>저장</Button>
    </div>
  )
}
