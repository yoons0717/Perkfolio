import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { inputClass } from '../components/formStyles'
import InfoTooltip from '../components/InfoTooltip'
import Select from '../components/Select'
import { useVisits } from '../hooks/useVisits'
import { formatWon } from '../lib/format'
import { statusBadgeClass } from '../lib/statusStyle'
import {
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computePlatformRanking,
  computeStatusCounts,
  computeTotals,
  computeUpcomingDeadlines,
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
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 font-mono text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { visits, loading, error } = useVisits()
  const [period, setPeriod] = useState<Period>('thisMonth')
  const [customRange, setCustomRange] = useState<CustomRange>([null, null])

  // "N월 요약" 섹션: 선택한 기간에 종속된 스냅샷 통계.
  const filtered = useMemo(
    () => visits.filter((v) => isInPeriod(v.visitDate, period, customRange)),
    [visits, period, customRange],
  )
  // 예정 상태는 아직 실제로 일어나지 않았으므로 금액/절감 통계에서는 제외한다.
  // (상태별 현황은 예정 항목도 그대로 보여줘야 하므로 filtered를 그대로 씀)
  const confirmed = useMemo(() => confirmedVisits(filtered), [filtered])

  const totals = useMemo(() => computeTotals(confirmed), [confirmed])
  const statusCounts = useMemo(() => computeStatusCounts(filtered), [filtered])
  const categoryBreakdown = useMemo(() => computeCategoryBreakdown(confirmed), [confirmed])

  // "전체 기록 기준" 섹션: 마감 임박/플랫폼 비교/월별 트렌드는 그 성격상 기간
  // 필터와 무관하게 항상 전체 데이터를 봐야 의미가 있다 (예: "이번 달"만 보면
  // 트렌드 차트에 점이 하나만 찍히고, 랭킹 차트엔 막대가 하나만 남는다).
  const allTimeConfirmed = useMemo(() => confirmedVisits(visits), [visits])
  const upcomingDeadlines = useMemo(() => computeUpcomingDeadlines(visits), [visits])
  const platformRanking = useMemo(() => computePlatformRanking(allTimeConfirmed), [allTimeConfirmed])
  const monthlyTrend = useMemo(() => computeMonthlyTrend(allTimeConfirmed), [allTimeConfirmed])

  if (loading) return null
  if (error) return <p className="text-sm text-red-400">{error}</p>

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-10 lg:max-w-5xl">
      <h1 className="mb-3 font-display text-2xl font-extrabold text-ink">대시보드</h1>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="w-36">
          <Select
            aria-label="기간 필터"
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="rounded-lg border border-line bg-surface px-3 py-3 text-sm text-ink"
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

      <div className="mb-3 flex items-center gap-1.5">
        <p className="font-display text-base font-extrabold text-ink">{periodLabel[period]} 요약</p>
        <InfoTooltip text="예정 상태는 금액 집계에서 제외" />
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="총 방문" value={`${totals.count}건`} />
        <StatCard label="체험가" value={formatWon(totals.retail)} />
        <StatCard label="추가결제액" value={formatWon(totals.extra)} />
        <StatCard label="순절감액" value={formatWon(totals.net)} valueClassName={totals.net < 0 ? 'text-red-400' : 'text-green'} />
        <StatCard label="평균 절감율" value={`${totals.rate}%`} />
      </div>

      <div className="mb-3 flex flex-wrap gap-3 rounded-xl border border-line bg-surface p-4">
        {statusCounts.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 font-mono text-xs ${statusBadgeClass(status)}`}>{status}</span>
            <span className="font-mono text-sm text-ink">{count}건</span>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-xl border border-line bg-surface p-4">
        <p className="mb-3 font-display text-sm font-bold text-ink">카테고리별 분포</p>
        <div className="flex flex-col gap-2">
          {categoryBreakdown.map(({ category, count, pct }) => (
            <div key={category} className="flex items-center gap-2 text-sm">
              <span className="w-12 text-muted">{category}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-blue" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right font-mono text-xs text-muted">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mb-3 font-display text-xs font-bold tracking-wide text-muted uppercase">
        전체 기록 기준 (기간 필터와 무관)
      </p>

      <div className="mb-3 rounded-xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-baseline gap-2">
          <p className="font-display text-sm font-bold text-ink">마감 임박 (D-3 이내)</p>
          <p className="text-xs text-muted">예정 포함</p>
        </div>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-sm text-muted">임박한 마감이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {upcomingDeadlines.map(({ visit, deadline }) => (
              <div
                key={visit.id}
                onClick={() => navigate(`/edit/${visit.id}`)}
                className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"
              >
                <span className="text-ink">{visit.storeName}</span>
                <span className="font-mono text-xs text-red-400">{deadline.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 font-display text-sm font-bold text-ink">플랫폼별 평균 절감액</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={platformRanking}>
              <CartesianGrid stroke="#2a2e37" vertical={false} />
              <XAxis dataKey="platform" tick={{ fill: '#7a8290', fontSize: 11 }} axisLine={{ stroke: '#2a2e37' }} tickLine={false} />
              <YAxis
                tick={{ fill: '#7a8290', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => value.toLocaleString('ko-KR')}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                wrapperStyle={{ zIndex: 10 }}
                contentStyle={{ background: '#1d2027', border: '1px solid #2a2e37', borderRadius: 8 }}
                labelStyle={{ color: '#e7e9ec' }}
                formatter={(value: number) => formatWon(value)}
              />
              <Bar dataKey="avgNet" name="평균 절감액" radius={[4, 4, 0, 0]}>
                {platformRanking.map((entry) => (
                  <Cell key={entry.platform} fill={entry.avgNet < 0 ? '#f87171' : '#5b8def'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4">
          <p className="mb-3 font-display text-sm font-bold text-ink">월별 절감액 트렌드</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid stroke="#2a2e37" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#7a8290', fontSize: 11 }} axisLine={{ stroke: '#2a2e37' }} tickLine={false} />
              <YAxis
                tick={{ fill: '#7a8290', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => value.toLocaleString('ko-KR')}
              />
              <Tooltip
                cursor={{ stroke: '#2a2e37' }}
                wrapperStyle={{ zIndex: 10 }}
                contentStyle={{ background: '#1d2027', border: '1px solid #2a2e37', borderRadius: 8 }}
                labelStyle={{ color: '#e7e9ec' }}
                formatter={(value: number) => formatWon(value)}
              />
              <Line type="monotone" dataKey="net" name="순절감액" stroke="#5b8def" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
