import Button from './Button'
import { buildNaverAuthorizeUrl } from '../lib/naverAuth'

export default function NaverLoginButton() {
  function handleClick() {
    const state = crypto.randomUUID()
    sessionStorage.setItem('naver_oauth_state', state)
    window.location.href = buildNaverAuthorizeUrl(state)
  }

  return (
    <Button type="button" onClick={handleClick} className="bg-[#03C75A] text-white">
      네이버로 시작하기
    </Button>
  )
}
