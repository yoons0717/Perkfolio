import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Logo from '../components/Logo'
import PasswordInput from '../components/PasswordInput'
import { signOut, updatePassword } from '../lib/auth'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
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
      const { error } = await updatePassword(password)

      if (error) {
        setError('비밀번호 변경에 실패했습니다.')
        return
      }

      // Sign out the temporary recovery session so the reset link can't be
      // reused as a standing login — the user logs back in with the new
      // password like normal. The password change already succeeded, so a
      // failure here shouldn't be reported as if the change itself failed.
      try {
        await signOut()
      } catch (err) {
        console.error(err)
      }
      navigate('/login', { state: { passwordResetSuccess: true } })
    } catch (err) {
      console.error(err)
      setError('비밀번호 변경에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm px-4">
      <Logo />
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">비밀번호 재설정</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          새 비밀번호
          <PasswordInput
            placeholder="새 비밀번호"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder-muted focus:border-blue focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          새 비밀번호 확인
          <PasswordInput
            placeholder="새 비밀번호 확인"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            className="rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder-muted focus:border-blue focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={submitting} className="mt-1">
          {submitting ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        <Link to="/login" className="text-blue">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  )
}
