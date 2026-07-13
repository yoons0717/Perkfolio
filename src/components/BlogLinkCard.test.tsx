import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import BlogLinkCard from './BlogLinkCard'
import { useAuth } from '../context/AuthContext'
import { getProfile, upsertProfile } from '../lib/profiles'
import type { Profile } from '../types/profile'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../lib/profiles', () => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
  deleteProfile: vi.fn(),
}))

vi.mock('./UnlinkBlogModal', () => ({
  default: ({ onClose, onUnlinked }: { onClose: () => void; onUnlinked: () => void }) => (
    <div>
      <button onClick={onClose}>모달 닫기</button>
      <button onClick={onUnlinked}>모달 확인</button>
    </div>
  ),
}))

const profile: Profile = {
  userId: 'user-1',
  blogUrl: 'https://blog.naver.com/yeonis',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

afterEach(() => {
  vi.clearAllMocks()
})

function mockSession() {
  vi.mocked(useAuth).mockReturnValue({
    session: { user: { id: 'user-1' } },
    loading: false,
    isPasswordRecovery: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

describe('BlogLinkCard', () => {
  it('shows the empty state and switches to the form on 블로그 등록하기 click', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(null)
    render(<BlogLinkCard />)

    expect(
      await screen.findByText('아직 등록된 블로그가 없어요. 블로그 주소를 등록하면 마이페이지에 노출돼요.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '블로그 등록하기' }))

    expect(screen.getByPlaceholderText('https://blog.naver.com/yourid')).toBeInTheDocument()
  })

  it('saves the form and shows the view state', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(null)
    vi.mocked(upsertProfile).mockResolvedValue(profile)
    render(<BlogLinkCard />)

    await userEvent.click(await screen.findByRole('button', { name: '블로그 등록하기' }))
    await userEvent.type(screen.getByPlaceholderText('https://blog.naver.com/yourid'), profile.blogUrl)
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(upsertProfile).toHaveBeenCalledWith('user-1', {
      blogUrl: profile.blogUrl,
    })
    expect(await screen.findByRole('link', { name: profile.blogUrl })).toHaveAttribute(
      'href',
      profile.blogUrl,
    )
  })

  it('shows a working link to the blog URL in view mode', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(profile)
    render(<BlogLinkCard />)

    expect(await screen.findByRole('link', { name: profile.blogUrl })).toHaveAttribute(
      'href',
      profile.blogUrl,
    )
  })

  it('opens the unlink modal and resets to the empty state when unlinked', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(profile)
    render(<BlogLinkCard />)

    await userEvent.click(await screen.findByRole('button', { name: '삭제' }))
    await userEvent.click(screen.getByText('모달 확인'))

    expect(
      await screen.findByText('아직 등록된 블로그가 없어요. 블로그 주소를 등록하면 마이페이지에 노출돼요.'),
    ).toBeInTheDocument()
  })

  it('shows an error state when the initial profile load fails', async () => {
    mockSession()
    vi.mocked(getProfile).mockRejectedValue(new Error('network error'))
    render(<BlogLinkCard />)

    expect(
      await screen.findByText('블로그 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.'),
    ).toBeInTheDocument()
  })

  it('rejects an invalid URL scheme without calling upsertProfile', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(null)
    render(<BlogLinkCard />)

    await userEvent.click(await screen.findByRole('button', { name: '블로그 등록하기' }))
    await userEvent.type(
      screen.getByPlaceholderText('https://blog.naver.com/yourid'),
      'javascript:alert(1)',
    )
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(
      await screen.findByText('http:// 또는 https://로 시작하는 주소를 입력해주세요.'),
    ).toBeInTheDocument()
    expect(upsertProfile).not.toHaveBeenCalled()
  })

  it('shows an error and stays in edit mode when saving fails', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(null)
    vi.mocked(upsertProfile).mockRejectedValue(new Error('저장에 실패했습니다. 다시 시도해주세요.'))
    render(<BlogLinkCard />)

    await userEvent.click(await screen.findByRole('button', { name: '블로그 등록하기' }))
    await userEvent.type(
      screen.getByPlaceholderText('https://blog.naver.com/yourid'),
      'https://blog.naver.com/yeonis',
    )
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByText('저장에 실패했습니다. 다시 시도해주세요.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('https://blog.naver.com/yourid')).toBeInTheDocument()
  })
})
