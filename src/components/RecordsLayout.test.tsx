import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RecordsLayout from './RecordsLayout'
import { useAuth } from '../context/AuthContext'
import { markOnboardingSeen } from '../lib/auth'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/auth', () => ({
  markOnboardingSeen: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

function renderRecordsLayout() {
  return render(
    <MemoryRouter initialEntries={['/table']}>
      <Routes>
        <Route element={<RecordsLayout />}>
          <Route path="/table" element={<div>표 내용</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RecordsLayout', () => {
  it('shows the welcome modal when the session has not seen onboarding yet', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1', user_metadata: {} } },
    } as never)

    renderRecordsLayout()

    expect(screen.getByText('PerkTrack에 오신 걸 환영해요')).toBeInTheDocument()
  })

  it('does not show the welcome modal when has_seen_onboarding is already true', () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1', user_metadata: { has_seen_onboarding: true } } },
    } as never)

    renderRecordsLayout()

    expect(screen.queryByText('PerkTrack에 오신 걸 환영해요')).not.toBeInTheDocument()
  })

  it('dismisses the modal after clicking 시작하기', async () => {
    vi.mocked(useAuth).mockReturnValue({
      session: { user: { id: '1', user_metadata: {} } },
    } as never)

    renderRecordsLayout()
    await userEvent.click(screen.getByRole('button', { name: '시작하기' }))

    expect(markOnboardingSeen).toHaveBeenCalled()
    expect(screen.queryByText('PerkTrack에 오신 걸 환영해요')).not.toBeInTheDocument()
  })
})
