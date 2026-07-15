import { useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { focusRingClass, inputClass } from '../components/formStyles'
import InfoTooltip from '../components/InfoTooltip'
import Panel from '../components/Panel'
import Section from '../components/Section'
import Select from '../components/Select'
import Spinner from '../components/Spinner'
import { useVisits } from '../hooks/useVisits'
import { formatWon } from '../lib/format'
import {
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeTotals,
  confirmedVisits,
  isInPeriod,
} from '../lib/visitStats'
import type { CustomRange, Period } from '../lib/visitStats'

const periodLabel: Record<Period, string> = {
  thisMonth: '이번 달',
  lastMonth: '지난달',
  thisYear: '올해',
  lastYear: '작년',
  all: '전체',
  custom: '선택한 기간',
}

function StatCard({ label, value, valueClassName = 'text-ink' }: { label: string; value: string; valueClassName?: string }) {
  return (
    <Panel>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold ${valueClassName}`}>{value}</p>
    </Panel>
  )
}

function ChartGrid() {
  return <CartesianGrid stroke="var(--color-line)" vertical={false} />
}

function ChartXAxis({ dataKey }: { dataKey: string }) {
  return (
    <XAxis
      dataKey={dataKey}
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

type MonthlyTrendPoint = { month: string; net: number; count: number }

function MonthlyTrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ payload?: MonthlyTrendPoint }>
}) {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) return null
  const { month, net, count } = payload[0].payload
  return (
    <div
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 8 }}
      className="px-3 py-2"
    >
      <p className="text-xs font-semibold text-ink">{month}</p>
      <p className="text-xs text-ink">순절감액 {formatWon(net)}</p>
      <p className="text-xs text-muted">{count}건</p>
    </div>
  )
}

export default function DashboardPage() {
  const { visits, loading, error } = useVisits()
  const [period, setPeriod] = useState<Period>('thisMonth')
  const [customRange, setCustomRange] = useState<CustomRange>([null, null])

  // "N월 요약" 섹션: 선택한 기간에 종속된 스냅샷 통계.
  const filtered = useMemo(
    () => visits.filter((v) => v.visitDate !== null && isInPeriod(v.visitDate, period, customRange)),
    [visits, period, customRange],
  )
  // 예정 상태는 아직 실제로 일어나지 않았으므로 금액/절감 통계에서는 제외한다.
  const confirmed = useMemo(() => confirmedVisits(filtered), [filtered])

  const totals = useMemo(() => computeTotals(confirmed), [confirmed])
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(confirmed), [confirmed])

  // 월별 트렌드는 기간 필터와 무관하게 항상 연초~이번 달 전체를 봐야 의미가 있다.
  const allTimeConfirmed = useMemo(() => confirmedVisits(visits), [visits])
  const monthlyTrend = useMemo(() => computeMonthlyTrend(allTimeConfirmed), [allTimeConfirmed])

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
          <p className="mb-4 font-display text-base font-extrabold text-ink">월별 순절감액</p>
          <Panel>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend}>
                <ChartGrid />
                <ChartXAxis dataKey="month" />
                <ChartYAxis />
                <Tooltip
                  cursor={{ stroke: 'var(--color-line)' }}
                  wrapperStyle={{ zIndex: 10 }}
                  content={(props) => <MonthlyTrendTooltip {...props} />}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="순절감액"
                  stroke="var(--color-blue)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Panel>
        </Section>
      </div>
    </div>
  )
}
