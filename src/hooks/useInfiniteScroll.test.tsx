import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useInfiniteScroll } from './useInfiniteScroll'
import { FakeIntersectionObserver } from '../test/fakeIntersectionObserver'

function TestHarness({
  totalCount,
  resetKey,
  batchSize,
}: {
  totalCount: number
  resetKey: string
  batchSize?: number
}) {
  const { displayCount, sentinelRef } = useInfiniteScroll(totalCount, resetKey, batchSize)
  return (
    <div>
      <span data-testid="count">{displayCount}</span>
      <div ref={sentinelRef} data-testid="sentinel" />
    </div>
  )
}

beforeEach(() => {
  FakeIntersectionObserver.instances = []
})

describe('useInfiniteScroll', () => {
  it('shows the full list when totalCount is smaller than the batch size', () => {
    render(<TestHarness totalCount={5} resetKey="a" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('5')
  })

  it('recalculates the batch once totalCount grows (e.g. data finishes loading)', () => {
    const { rerender } = render(<TestHarness totalCount={0} resetKey="a" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('0')

    rerender(<TestHarness totalCount={45} resetKey="a" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('20')
  })

  it('loads one more batch when the sentinel intersects, capped at totalCount', () => {
    render(<TestHarness totalCount={45} resetKey="a" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('20')

    FakeIntersectionObserver.intersect()
    expect(screen.getByTestId('count')).toHaveTextContent('40')

    FakeIntersectionObserver.intersect()
    expect(screen.getByTestId('count')).toHaveTextContent('45')
  })

  it('resets back to the first batch when resetKey changes', () => {
    const { rerender } = render(<TestHarness totalCount={45} resetKey="a" batchSize={20} />)
    FakeIntersectionObserver.intersect()
    expect(screen.getByTestId('count')).toHaveTextContent('40')

    rerender(<TestHarness totalCount={45} resetKey="b" batchSize={20} />)
    expect(screen.getByTestId('count')).toHaveTextContent('20')
  })
})
