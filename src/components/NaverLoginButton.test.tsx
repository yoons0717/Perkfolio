import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NaverLoginButton from './NaverLoginButton'
import { buildNaverAuthorizeUrl } from '../lib/naverAuth'

vi.mock('../lib/naverAuth', () => ({
  buildNaverAuthorizeUrl: vi.fn(() => 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=test&redirect_uri=http://localhost/auth/naver/callback&state=test-state'),
}))

afterEach(() => vi.clearAllMocks())

describe('NaverLoginButton', () => {
  it('stores a state and redirects on click', () => {
    delete (window as unknown as { location: unknown }).location
    window.location = { href: '' } as Location
    render(<NaverLoginButton />)
    fireEvent.click(screen.getByRole('button', { name: '네이버로 시작하기' }))
    const storedState = sessionStorage.getItem('naver_oauth_state')
    expect(storedState).toBeTruthy()
    expect(buildNaverAuthorizeUrl).toHaveBeenCalledWith(storedState)
    expect(window.location.href).toContain('nid.naver.com')
  })
})
