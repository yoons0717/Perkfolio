import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import StatusBadgeButton from './StatusBadgeButton'

describe('StatusBadgeButton', () => {
  it('renders the status text and calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<StatusBadgeButton status="예정" onClick={onClick} />)

    const button = screen.getByRole('button', { name: '예정' })
    await userEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
