import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FeedbackModal from './FeedbackModal'
import { useAuth } from '../context/AuthContext'
import { addFeedback } from '../lib/feedback'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/feedback', () => ({
  addFeedback: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    session: { user: { id: '1', email: 'user@example.com' } },
    loading: false,
  } as never)
})

afterEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

describe('FeedbackModal', () => {
  it('locks and restores body scroll while mounted', () => {
    const { unmount } = render(<FeedbackModal onClose={vi.fn()} />)

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('')
  })

  it('submits the selected type and entered content', async () => {
    vi.mocked(addFeedback).mockResolvedValue(undefined)
    render(<FeedbackModal onClose={vi.fn()} />)

    await userEvent.selectOptions(screen.getByLabelText('유형'), '건의사항')
    await userEvent.type(screen.getByLabelText('내용'), '버튼이 안 눌려요')
    await userEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(addFeedback).toHaveBeenCalledWith({
      type: '건의',
      content: '버튼이 안 눌려요',
      userEmail: 'user@example.com',
    })
    expect(await screen.findByText('제출되었습니다. 감사합니다!')).toBeInTheDocument()
  })

  it('disables the 취소 button while submitting', async () => {
    let resolveSubmit: () => void = () => {}
    vi.mocked(addFeedback).mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve
      }),
    )
    render(<FeedbackModal onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('내용'), '테스트')
    await userEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(screen.getByRole('button', { name: '취소' })).toBeDisabled()
    resolveSubmit()
  })

  it('closes via the confirmation view\'s 닫기 button', async () => {
    vi.mocked(addFeedback).mockResolvedValue(undefined)
    const onClose = vi.fn()
    render(<FeedbackModal onClose={onClose} />)

    await userEvent.type(screen.getByLabelText('내용'), '테스트')
    await userEvent.click(screen.getByRole('button', { name: '제출' }))
    await userEvent.click(await screen.findByRole('button', { name: '닫기' }))

    expect(onClose).toHaveBeenCalled()
  })

  it('closes without submitting when 취소 is clicked', async () => {
    const onClose = vi.fn()
    render(<FeedbackModal onClose={onClose} />)

    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(onClose).toHaveBeenCalled()
    expect(addFeedback).not.toHaveBeenCalled()
  })

  it('shows an error message when submission fails', async () => {
    vi.mocked(addFeedback).mockRejectedValue(new Error('network error'))
    render(<FeedbackModal onClose={vi.fn()} />)

    await userEvent.type(screen.getByLabelText('내용'), '테스트')
    await userEvent.click(screen.getByRole('button', { name: '제출' }))

    expect(await screen.findByText('제출에 실패했습니다. 잠시 후 다시 시도해주세요.')).toBeInTheDocument()
  })
})
