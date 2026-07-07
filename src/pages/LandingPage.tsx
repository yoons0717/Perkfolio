import { Link, Navigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'

const features = [
  '표·캘린더 뷰',
  '대시보드 통계',
  '마감 임박 알림',
]

export default function LandingPage() {
  const { session, loading } = useAuth()

  if (loading) return null
  if (session) return <Navigate to="/table" replace />

  return (
    <div className="mx-auto flex min-h-[calc(100vh-57px)] max-w-2xl flex-col justify-center px-4 py-10">
      <Logo />
      <h1 className="mb-5 mt-8 font-display text-3xl font-extrabold leading-snug text-ink sm:text-4xl">
        체험단 방문, <span className="text-blue">한곳에서 관리하세요</span>
      </h1>
      <p className="mb-8 max-w-md text-base leading-relaxed text-muted">
        방문 기록부터 절감액, 리뷰 마감일까지 한 번에.
      </p>
      <div className="mb-9 flex flex-wrap gap-2">
        {features.map((feature) => (
          <span
            key={feature}
            className="rounded-full border border-line bg-surface px-3 py-1.5 font-display text-xs font-semibold text-ink"
          >
            {feature}
          </span>
        ))}
      </div>
      <div className="flex gap-3">
        <Link
          to="/signup"
          className="rounded-lg bg-blue px-6 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-blue/90"
        >
          회원가입
        </Link>
        <Link
          to="/login"
          className="rounded-lg border border-line px-6 py-3 font-display text-sm font-bold text-ink transition-colors hover:bg-overlay"
        >
          로그인
        </Link>
      </div>
    </div>
  )
}
