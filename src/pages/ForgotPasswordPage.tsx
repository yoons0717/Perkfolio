import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/Button'
import { resetPasswordForEmail } from '../lib/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const { error } = await resetPasswordForEmail(email)

      if (error) {
        setError('재설정 링크 전송에 실패했습니다.')
        return
      }

      setSent(true)
    } catch (err) {
      console.error(err)
      setError('재설정 링크 전송에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm px-4">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">비밀번호 찾기</h1>
      {sent ? (
        <p className="text-sm text-ink">비밀번호 재설정 링크를 이메일로 보냈습니다.</p>
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
              className="rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder-muted focus:border-blue focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={submitting} className="mt-1">
            {submitting ? '전송 중...' : '재설정 링크 보내기'}
          </Button>
        </form>
      )}
      <p className="mt-4 text-sm text-muted">
        <Link to="/login" className="text-blue">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  )
}
