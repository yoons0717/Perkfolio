import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import GraphCard from './GraphCard'
import type { DashboardGraph } from '../types/dashboardGraph'

afterEach(() => {
  vi.clearAllMocks()
})

function makeGraph(overrides: Partial<DashboardGraph> = {}): DashboardGraph {
  return {
    id: 'g1',
    axis: 'category',
    chartType: 'bar',
    scope: 'all',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('GraphCard', () => {
  it('renders a bar row per data entry with label, amount, and count for bar charts', () => {
    render(
      <GraphCard
        graph={makeGraph({ axis: 'category', scope: 'all' })}
        data={[
          { label: '카페', avgNet: 38000, count: 6 },
          { label: '음식점', avgNet: -12000, count: 2 },
        ]}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('카테고리별 평균 절감액')).toBeInTheDocument()
    expect(screen.getByText('전체 기준')).toBeInTheDocument()
    expect(screen.getByText('카페')).toBeInTheDocument()
    expect(screen.getByText('₩38,000')).toBeInTheDocument()
    expect(screen.getByText('6건')).toBeInTheDocument()
    expect(screen.getByText('₩-12,000')).toBeInTheDocument()
    expect(screen.getByText('2건')).toBeInTheDocument()
  })

  it('shows a dash instead of ₩0 for a zero-count entry', () => {
    render(
      <GraphCard
        graph={makeGraph({ axis: 'category', scope: 'all' })}
        data={[{ label: '기타', avgNet: 0, count: 0 }]}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.queryByText('₩0')).not.toBeInTheDocument()
  })

  it('does not show a scope subtitle for the month axis', () => {
    render(
      <GraphCard
        graph={makeGraph({ axis: 'month', chartType: 'line', scope: 'all' })}
        data={[{ label: '2026-01', avgNet: 40000, count: 2 }]}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('월별 평균 절감액')).toBeInTheDocument()
    expect(screen.queryByText('전체 기준')).not.toBeInTheDocument()
  })

  it('shows a placeholder message when data is empty', () => {
    render(<GraphCard graph={makeGraph()} data={[]} onDelete={vi.fn()} />)

    expect(screen.getByText('아직 데이터가 없습니다.')).toBeInTheDocument()
  })

  it('calls onDelete when the delete button is clicked', async () => {
    const onDelete = vi.fn()
    render(
      <GraphCard
        graph={makeGraph()}
        data={[{ label: '카페', avgNet: 38000, count: 6 }]}
        onDelete={onDelete}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(onDelete).toHaveBeenCalled()
  })

  it('renders a line chart without crashing for chartType=line', () => {
    render(
      <GraphCard
        graph={makeGraph({ axis: 'month', chartType: 'line', scope: 'all' })}
        data={[
          { label: '2026-01', avgNet: 40000, count: 2 },
          { label: '2026-02', avgNet: 52000, count: 3 },
        ]}
        onDelete={vi.fn()}
      />,
    )

    expect(screen.getByText('월별 평균 절감액')).toBeInTheDocument()
    // Line charts don't render the bar-row layout (no per-row count labels).
    expect(screen.queryByText('2건')).not.toBeInTheDocument()
  })
})
