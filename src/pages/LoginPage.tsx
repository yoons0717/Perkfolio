import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithPassword } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await signInWithPassword(email, password)

    setSubmitting(false)

    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      return
    }

    navigate('/table')
  }

  return (
    <div className="mx-auto mt-24 w-full max-w-sm px-4">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">로그인</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder-muted focus:border-blue focus:outline-none"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder-muted focus:border-blue focus:outline-none"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 rounded-lg bg-blue px-3 py-2 font-display text-sm font-bold text-white disabled:opacity-50"
        >
          {submitting ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  )
}
