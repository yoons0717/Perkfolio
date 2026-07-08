import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NaverCallbackPage from './NaverCallbackPage'
import { exchangeNaverCode, completeNaverSignIn } from '../lib/naverAuth'

vi.mock('../lib/naverAuth', () => ({
  exchangeNaverCode: vi.fn(),
  completeNaverSignIn: vi.fn(),
}))

afterEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

function renderAt(search: string) {
  window.history.pushState({}, '', `/auth/naver/callback${search}`)
  return render(
    <MemoryRouter initialEntries={[`/auth/naver/callback${search}`]}>
      <NaverCallbackPage />
    </MemoryRouter>,
  )
}

describe('NaverCallbackPage', () => {
  it('shows error when state does not match', async () => {
    sessionStorage.setItem('naver_oauth_state', 'expected')
    renderAt('?code=abc&state=wrong')
    expect(await screen.findByText(/올바르지 않습니다/)).toBeInTheDocument()
  })

  it('shows error on naver error callback', async () => {
    renderAt('?error=access_denied')
    expect(await screen.findByText(/취소되었습니다/)).toBeInTheDocument()
  })

  it('completes sign-in and shows success path on match', async () => {
    sessionStorage.setItem('naver_oauth_state', 'st1')
    vi.mocked(exchangeNaverCode).mockResolvedValue({ email: 'a@b.com', token: 'tok' })
    vi.mocked(completeNaverSignIn).mockResolvedValue({ error: null } as never)
    renderAt('?code=abc&state=st1')
    await waitFor(() => expect(completeNaverSignIn).toHaveBeenCalledWith('a@b.com', 'tok'))
  })
})
