import Button from './Button'
import { buildNaverAuthorizeUrl } from '../lib/naverAuth'

export default function NaverLoginButton() {
  function handleClick() {
    const state = crypto.randomUUID()
    sessionStorage.setItem('naver_oauth_state', state)
    window.location.href = buildNaverAuthorizeUrl(state)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      className="rounded-lg bg-[#03C75A] px-3 py-3 text-sm font-bold text-white hover:bg-[#03C75A]/90"
    >
      네이버로 시작하기
    </Button>
  )
}
