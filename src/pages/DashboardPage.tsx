import { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import Button from '../components/Button'
import FloatingAddButton from '../components/FloatingAddButton'
import { focusRingClass, inputClass } from '../components/formStyles'
import GraphBuilderForm from '../components/GraphBuilderForm'
import GraphCard from '../components/GraphCard'
import InfoTooltip from '../components/InfoTooltip'
import Panel from '../components/Panel'
import Section from '../components/Section'
import Select from '../components/Select'
import Spinner from '../components/Spinner'
import { useDashboardGraphs } from '../hooks/useDashboardGraphs'
import { useVisits } from '../hooks/useVisits'
import { formatWon } from '../lib/format'
import { computeCategoryBreakdown, computeGraphData, computeTotals, confirmedVisits, isInPeriod } from '../lib/visitStats'
import type { CustomRange, Period } from '../lib/visitStats'
import type { DashboardGraph } from '../types/dashboardGraph'
import type { Visit } from '../types/visit'

const periodLabel: Record<Period, string> = {
  thisMonth: '이번 달',
  lastMonth: '지난달',
  thisYear: '올해',
  lastYear: '작년',
  all: '전체',
  custom: '선택한 기간',
}

// 그래프별 scope는 상단 기간 필터와 독립적으로, 그래프 자신의 기간 선택을 따른다.
function visitsForGraphScope(scope: DashboardGraph['scope'], allTimeConfirmed: Visit[]): Visit[] {
  if (scope === 'all') return allTimeConfirmed
  return allTimeConfirmed.filter((v) => v.visitDate !== null && isInPeriod(v.visitDate, scope))
}

function StatCard({ label, value, valueClassName = 'text-ink' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <Panel>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold ${valueClassName}`}>{value}</p>
    </Panel>
  )
}

export default function DashboardPage() {
  const { visits, loading, error } = useVisits()
  const { graphs, loading: graphsLoading, error: graphsError, addGraph, removeGraph } = useDashboardGraphs()
  const [period, setPeriod] = useState<Period>('thisMonth')
  const [customRange, setCustomRange] = useState<CustomRange>([null, null])
  const [showGraphBuilder, setShowGraphBuilder] = useState(false)
  const [graphActionError, setGraphActionError] = useState<string | null>(null)

  // "N월 요약" 섹션: 선택한 기간에 종속된 스냅샷 통계.
  const filtered = useMemo(
    () => visits.filter((v) => v.visitDate !== null && isInPeriod(v.visitDate, period, customRange)),
    [visits, period, customRange],
  )
  // 예정 상태는 아직 실제로 일어나지 않았으므로 금액/절감 통계에서는 제외한다.
  const confirmed = useMemo(() => confirmedVisits(filtered), [filtered])

  const totals = useMemo(() => computeTotals(confirmed), [confirmed])
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(confirmed), [confirmed])

  // 커스텀 그래프의 scope==='all'은 기간 필터와 무관하게 항상 전체 데이터를 봐야 한다.
  const allTimeConfirmed = useMemo(() => confirmedVisits(visits), [visits])

  if (loading) return <Spinner />
  if (error) return <p className="text-sm text-danger">{error}</p>

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-24 lg:max-w-5xl">
      <h1 className="mb-5 font-display text-2xl font-extrabold text-ink">대시보드</h1>

      <div className="flex flex-col gap-6">
        <Section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <p className="font-display text-base font-extrabold text-ink">{periodLabel[period]} 요약</p>
              <InfoTooltip text="예정 상태는 금액 집계에서 제외" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-36">
                <Select
                  aria-label="기간 필터"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className={`rounded-lg border border-line bg-overlay px-3 py-3 text-sm text-ink ${focusRingClass}`}
                >
                  <option value="thisMonth">이번 달</option>
                  <option value="lastMonth">지난달</option>
                  <option value="thisYear">올해</option>
                  <option value="lastYear">작년</option>
                  <option value="all">전체</option>
                  <option value="custom">직접 선택</option>
                </Select>
              </div>
              {period === 'custom' && (
                <DatePicker
                  aria-label="기간 범위 선택"
                  selectsRange
                  startDate={customRange[0]}
                  endDate={customRange[1]}
                  onChange={(update: CustomRange) => setCustomRange(update)}
                  dateFormat="yyyy-MM-dd"
                  className={`w-[15.5rem] ${inputClass}`}
                />
              )}
            </div>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="총 체험단" value={`${totals.count}건`} />
            <StatCard label="체험가" value={formatWon(totals.retail)} />
            <StatCard label="추가결제액" value={formatWon(totals.extra)} />
            <StatCard label="순절감액" value={formatWon(totals.net)} valueClassName={totals.net < 0 ? 'text-danger' : 'text-positive'} />
            <StatCard label="평균 절감율" value={`${totals.rate}%`} />
          </div>

          <Panel>
            <p className="mb-3 font-display text-sm font-bold text-ink">카테고리별 분포 · 평균 절감액</p>
            <div className="flex flex-col gap-2">
              {categoryBreakdown.map(({ category, count, pct, avgNet }) => (
                <div key={category} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-muted">{category}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-blue" style={{ width: `${pct}%` }} />
                  </div>
                  <span
                    className={`w-20 shrink-0 text-right font-mono text-xs font-semibold ${avgNet < 0 ? 'text-danger' : 'text-blue'}`}
                  >
                    {count === 0 ? '-' : formatWon(avgNet)}
                  </span>
                  <span className="w-8 shrink-0 text-right font-mono text-xs text-muted">{count}건</span>
                </div>
              ))}
            </div>
          </Panel>
        </Section>

        <Section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-display text-base font-extrabold text-ink">커스텀 그래프</p>
            <Button variant="secondary" size="sm" onClick={() => setShowGraphBuilder((prev) => !prev)}>
              {showGraphBuilder ? '닫기' : '+ 그래프 추가'}
            </Button>
          </div>

          {showGraphBuilder && (
            <Panel className="mb-3">
              <GraphBuilderForm
                onSave={async (g) => {
                  try {
                    await addGraph(g)
                    setGraphActionError(null)
                    setShowGraphBuilder(false)
                  } catch {
                    setGraphActionError('그래프를 추가하지 못했습니다.')
                  }
                }}
              />
            </Panel>
          )}

          {graphsError && <p className="text-sm text-danger">{graphsError}</p>}
          {graphActionError && <p className="text-sm text-danger">{graphActionError}</p>}

          {!graphsLoading && !graphsError && graphs.length > 0 && (
            <div className="flex flex-col gap-3">
              {graphs.map((graph) => (
                <GraphCard
                  key={graph.id}
                  graph={graph}
                  data={computeGraphData(visitsForGraphScope(graph.scope, allTimeConfirmed), graph.axis)}
                  onDelete={async () => {
                    try {
                      await removeGraph(graph.id)
                      setGraphActionError(null)
                    } catch {
                      setGraphActionError('그래프를 삭제하지 못했습니다.')
                    }
                  }}
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      <FloatingAddButton />
    </div>
  )
}
