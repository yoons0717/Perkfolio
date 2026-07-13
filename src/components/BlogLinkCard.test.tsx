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
  blogName: '여니의 체험단 일기',
  blogDescription: '맛집 후기 블로그',
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
  it('shows the empty state and switches to the form on 블로그 연동하기 click', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(null)
    render(<BlogLinkCard />)

    expect(
      await screen.findByText('아직 연동된 블로그가 없어요. 블로그 주소를 등록하면 마이페이지에 노출돼요.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '블로그 연동하기' }))

    expect(screen.getByPlaceholderText('https://blog.naver.com/yourid')).toBeInTheDocument()
  })

  it('saves the form and shows the view state', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(null)
    vi.mocked(upsertProfile).mockResolvedValue(profile)
    render(<BlogLinkCard />)

    await userEvent.click(await screen.findByRole('button', { name: '블로그 연동하기' }))
    await userEvent.type(screen.getByPlaceholderText('https://blog.naver.com/yourid'), profile.blogUrl)
    await userEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(upsertProfile).toHaveBeenCalledWith('user-1', {
      blogUrl: profile.blogUrl,
      blogName: null,
      blogDescription: null,
    })
    expect(await screen.findByText(profile.blogName as string)).toBeInTheDocument()
  })

  it('shows the linked blog name, description and a working link in view mode', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(profile)
    render(<BlogLinkCard />)

    expect(await screen.findByText(profile.blogName as string)).toBeInTheDocument()
    expect(screen.getByText(profile.blogDescription as string)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '바로가기' })).toHaveAttribute('href', profile.blogUrl)
  })

  it('opens the unlink modal and resets to the empty state when unlinked', async () => {
    mockSession()
    vi.mocked(getProfile).mockResolvedValue(profile)
    render(<BlogLinkCard />)

    await userEvent.click(await screen.findByRole('button', { name: '연동 해제' }))
    await userEvent.click(screen.getByText('모달 확인'))

    expect(
      await screen.findByText('아직 연동된 블로그가 없어요. 블로그 주소를 등록하면 마이페이지에 노출돼요.'),
    ).toBeInTheDocument()
  })
})
