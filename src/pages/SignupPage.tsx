import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Logo from '../components/Logo'
import PasswordInput from '../components/PasswordInput'
import { authInputClass } from '../components/formStyles'
import { signUpWithPassword } from '../lib/auth'

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await signUpWithPassword(email, password)

      if (error) {
        setError('회원가입에 실패했습니다.')
        return
      }

      if (data.session) {
        navigate('/table')
      } else if (data.user?.identities?.length === 0) {
        // Supabase's anti-enumeration response for an already-registered
        // email: no error, no session, and an obfuscated user with no
        // identities — must not be shown as a real "check your email" success.
        setError('이미 가입된 이메일입니다. 로그인해주세요.')
      } else {
        setConfirmationSent(true)
      }
    } catch (err) {
      console.error(err)
      setError('회원가입에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm px-4">
      <Logo />
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">회원가입</h1>
      {confirmationSent ? (
        <p className="text-sm text-ink">가입 확인 이메일을 보냈습니다. 메일함을 확인해주세요.</p>
      ) : (
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={authInputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            비밀번호 확인
            <PasswordInput
              placeholder="비밀번호 확인"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              className={authInputClass}
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-1">
            {submitting ? '가입 중...' : '회원가입'}
          </Button>
        </form>
      )}
      <p className="mt-4 text-sm text-muted">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="text-blue">
          로그인
        </Link>
      </p>
    </div>
  )
}
