import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import UnlinkBlogModal from './UnlinkBlogModal'
import { deleteProfile } from '../lib/profiles'

vi.mock('../lib/profiles', () => ({
  deleteProfile: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
  document.body.style.overflow = ''
})

describe('UnlinkBlogModal', () => {
  it('locks and restores body scroll while mounted', () => {
    const { unmount } = render(<UnlinkBlogModal userId="user-1" onClose={vi.fn()} onUnlinked={vi.fn()} />)

    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('')
  })

  it('closes without unlinking when 취소 is clicked', async () => {
    const onClose = vi.fn()
    render(<UnlinkBlogModal userId="user-1" onClose={onClose} onUnlinked={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(onClose).toHaveBeenCalled()
    expect(deleteProfile).not.toHaveBeenCalled()
  })

  it('calls deleteProfile and onUnlinked when confirmed', async () => {
    vi.mocked(deleteProfile).mockResolvedValue(undefined)
    const onUnlinked = vi.fn()
    render(<UnlinkBlogModal userId="user-1" onClose={vi.fn()} onUnlinked={onUnlinked} />)

    await userEvent.click(screen.getByRole('button', { name: '삭제하기' }))

    expect(deleteProfile).toHaveBeenCalledWith('user-1')
    expect(onUnlinked).toHaveBeenCalled()
  })

  it('shows an error message and stays open when unlinking fails', async () => {
    vi.mocked(deleteProfile).mockRejectedValue(new Error('삭제에 실패했습니다. 다시 시도해주세요.'))
    const onUnlinked = vi.fn()
    render(<UnlinkBlogModal userId="user-1" onClose={vi.fn()} onUnlinked={onUnlinked} />)

    await userEvent.click(screen.getByRole('button', { name: '삭제하기' }))

    expect(await screen.findByText('삭제에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument()
    expect(onUnlinked).not.toHaveBeenCalled()
  })
})
