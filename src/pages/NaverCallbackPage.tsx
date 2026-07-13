import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeNaverCode, completeNaverSignIn } from '../lib/naverAuth'

export default function NaverCallbackPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    async function run() {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')
      const naverError = params.get('error')
      const savedState = sessionStorage.getItem('naver_oauth_state')
      sessionStorage.removeItem('naver_oauth_state')

      if (naverError) {
        setError('네이버 로그인이 취소되었습니다.')
        return
      }
      if (!code || !state || state !== savedState) {
        setError('로그인 요청이 올바르지 않습니다. 다시 시도해주세요.')
        return
      }

      try {
        const { token, type } = await exchangeNaverCode(code, state)
        const { error: otpError } = await completeNaverSignIn(token, type)
        if (otpError) {
          setError('로그인에 실패했습니다. 다시 시도해주세요.')
          return
        }
        navigate('/table')
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : '로그인에 실패했습니다. 다시 시도해주세요.')
      }
    }
    run()
  }, [navigate])

  if (error) {
    return (
      <div className="mx-auto mt-24 w-full max-w-sm px-4 text-center">
        <p className="mb-3 text-sm text-danger">{error}</p>
        <a href="/login" className="text-blue text-sm">로그인 페이지로 돌아가기</a>
      </div>
    )
  }

  return <div className="mx-auto mt-24 w-full max-w-sm px-4 text-center text-sm text-muted">로그인 처리 중...</div>
}
