import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Logo from '../components/Logo'
import PasswordInput from '../components/PasswordInput'
import NaverLoginButton from '../components/NaverLoginButton'
import { authInputClass } from '../components/formStyles'
import { signInWithPassword } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  // Captured once on mount so the banner still shows for this page view;
  // the history entry's state is cleared right after so a later Back/
  // Forward to this same entry won't resurrect a stale success message.
  const [passwordResetSuccess] = useState(() =>
    Boolean((location.state as { passwordResetSuccess?: boolean } | null)?.passwordResetSuccess),
  )

  useEffect(() => {
    if (passwordResetSuccess) {
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  }, [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const { error } = await signInWithPassword(email, password)

      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        return
      }

      navigate('/table')
    } catch (err) {
      console.error(err)
      setError('로그인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm px-4">
      <Logo />
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">로그인</h1>
      {passwordResetSuccess && (
        <p className="mb-3 text-sm text-positive">비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.</p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          이메일
          <input
            type="email"
            placeholder="이메일"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={authInputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          비밀번호
          <PasswordInput
            placeholder="비밀번호"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={authInputClass}
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={submitting} className="mt-1">
          {submitting ? '로그인 중...' : '로그인'}
        </Button>
        <div className="my-3 text-center text-xs text-muted">또는</div>
        <NaverLoginButton />
      </form>
      <div className="mt-4 flex justify-between text-sm text-muted">
        <Link to="/signup" className="text-blue">
          회원가입
        </Link>
        <Link to="/forgot-password" className="text-blue">
          비밀번호 찾기
        </Link>
      </div>
    </div>
  )
}
