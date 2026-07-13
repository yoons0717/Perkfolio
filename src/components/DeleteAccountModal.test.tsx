import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DeleteAccountModal from './DeleteAccountModal'
import { deleteAccount } from '../lib/auth'

vi.mock('../lib/auth', () => ({
  deleteAccount: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

describe('DeleteAccountModal', () => {
  it('locks and restores body scroll while mounted', () => {
    const { unmount } = render(<DeleteAccountModal onClose={vi.fn()} onDeleted={vi.fn()} />)

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('')
  })

  it('closes without deleting when 취소 is clicked', async () => {
    const onClose = vi.fn()
    render(<DeleteAccountModal onClose={onClose} onDeleted={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(onClose).toHaveBeenCalled()
    expect(deleteAccount).not.toHaveBeenCalled()
  })

  it('calls deleteAccount and onDeleted when confirmed', async () => {
    vi.mocked(deleteAccount).mockResolvedValue(undefined)
    const onDeleted = vi.fn()
    render(<DeleteAccountModal onClose={vi.fn()} onDeleted={onDeleted} />)

    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }))

    expect(deleteAccount).toHaveBeenCalled()
    expect(onDeleted).toHaveBeenCalled()
  })

  it('shows an error message and stays open when deletion fails', async () => {
    vi.mocked(deleteAccount).mockRejectedValue(new Error('회원 탈퇴에 실패했습니다. 다시 시도해주세요.'))
    const onDeleted = vi.fn()
    render(<DeleteAccountModal onClose={vi.fn()} onDeleted={onDeleted} />)

    await userEvent.click(screen.getByRole('button', { name: '탈퇴하기' }))

    expect(await screen.findByText('회원 탈퇴에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument()
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
