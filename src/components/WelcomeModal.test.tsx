import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import WelcomeModal from './WelcomeModal'
import { markOnboardingSeen } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  markOnboardingSeen: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe('WelcomeModal', () => {
  it('renders the welcome copy and usage steps', () => {
    render(<WelcomeModal onDismiss={vi.fn()} />)

    expect(screen.getByText('Perkfolio에 오신 걸 환영해요')).toBeInTheDocument()
    expect(screen.getByText('+ 버튼으로 체험단을 추가해보세요')).toBeInTheDocument()
  })

  it('marks onboarding as seen and dismisses when "시작하기" is clicked', async () => {
    const onDismiss = vi.fn()
    render(<WelcomeModal onDismiss={onDismiss} />)

    await userEvent.click(screen.getByRole('button', { name: '시작하기' }))

    expect(markOnboardingSeen).toHaveBeenCalled()
    expect(onDismiss).toHaveBeenCalled()
  })
})
