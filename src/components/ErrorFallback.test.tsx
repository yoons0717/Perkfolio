import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ErrorFallback from './ErrorFallback'

describe('ErrorFallback', () => {
  it('shows an error message and calls resetErrorBoundary when "다시 시도" is clicked', async () => {
    const resetErrorBoundary = vi.fn()
    render(
      <MemoryRouter>
        <ErrorFallback error={new Error('boom')} resetErrorBoundary={resetErrorBoundary} />
      </MemoryRouter>,
    )

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1)
  })

  it('resets the boundary when navigating back to 체험단 내역', async () => {
    const resetErrorBoundary = vi.fn()
    render(
      <MemoryRouter>
        <ErrorFallback error={new Error('boom')} resetErrorBoundary={resetErrorBoundary} />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('link', { name: '체험단 내역으로' }))

    expect(resetErrorBoundary).toHaveBeenCalledTimes(1)
  })
})
