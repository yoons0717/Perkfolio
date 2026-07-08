import { useState } from 'react'
import Button from './Button'
import Select from './Select'
import { selectClass } from './formStyles'
import type { NewDashboardGraph } from '../types/dashboardGraph'

type Axis = NewDashboardGraph['axis']
type ChartType = NewDashboardGraph['chartType']
type Scope = NewDashboardGraph['scope']

const scopeOptions: { value: Scope; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'thisMonth', label: '이번 달' },
  { value: 'lastMonth', label: '지난달' },
  { value: 'thisYear', label: '올해' },
  { value: 'lastYear', label: '작년' },
]

// 셀렉트와 "고정" 안내 자리의 높이/여백을 맞춰 축 전환 시 레이아웃이 흔들리지 않게 한다.
const fixedFieldClass = `${selectClass} border-dashed text-center text-xs text-muted`

export default function GraphBuilderForm({ onSave }: { onSave: (g: NewDashboardGraph) => void }) {
  const [axis, setAxis] = useState<Axis>('category')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [scope, setScope] = useState<Scope>('all')

  // axis=month: chartType(막대/라인) 선택 가능, scope는 항상 'all' 고정.
  // axis=category/platform: chartType은 항상 'bar' 고정, scope(전체/이번 달/지난달/올해/작년) 선택 가능.
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
  )
}
