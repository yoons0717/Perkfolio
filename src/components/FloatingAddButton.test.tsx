import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import FloatingAddButton from './FloatingAddButton'

describe('FloatingAddButton', () => {
  it('links to the add-visit page', () => {
    render(
      <MemoryRouter>
        <FloatingAddButton />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '방문 추가' })).toHaveAttribute('href', '/add')
  })
})
