import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import BackButton from './BackButton'

describe('BackButton', () => {
  it('navigates back to the previous page in history when clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/table', '/add']} initialIndex={1}>
        <Routes>
          <Route path="/table" element={<div>표 화면</div>} />
          <Route path="/add" element={<BackButton />} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }))

    expect(await screen.findByText('표 화면')).toBeInTheDocument()
  })
})
