import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import BlogLinkCard from '../components/BlogLinkCard'
import Button from '../components/Button'
import Card from '../components/Card'
import MyFeedbackCard from '../components/MyFeedbackCard'
import DeleteAccountModal from '../components/DeleteAccountModal'
import FeedbackModal from '../components/FeedbackModal'
import { MoonIcon, SunIcon } from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { isAdmin } from '../lib/admin'
import { signOut } from '../lib/auth'

export default function MyPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedbackListKey, setFeedbackListKey] = useState(0)

  async function handleDeleted() {
    // account is already gone at this point, so a signOut failure shouldn't
    // strand the user on the delete modal; still navigate away, just log it
    const { error } = await signOut()
    if (error) console.error(error)
    navigate('/login')
  }

  async function handleLogout() {
    const { error } = await signOut()
    // unlike handleDeleted, the account still exists here, so on failure
    // stay put (don't navigate) — the session may still be valid and the
    // user can just retry, instead of being sent to /login for no reason
    if (error) {
      console.error(error)
      return
    }
    navigate('/login')
  }

  const showAdminLink = isAdmin(session?.user.app_metadata)

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-24">
      <div className="mb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="font-display text-2xl font-extrabold text-ink">마이페이지</h1>
      </div>
      <div className="flex flex-col gap-4">
        <BlogLinkCard />
        <MyFeedbackCard key={feedbackListKey} />

        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-overlay"
          >
            화면 테마
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsFeedbackOpen(true)}
            className="w-full px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-overlay"
          >
            문의하기
          </Button>
          {showAdminLink && (
            <Link
              to="/admin/feedback"
              className="block px-4 py-3 text-sm font-semibold text-ink hover:bg-overlay"
            >
              관리자 페이지
            </Link>
          )}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-sm font-semibold text-danger hover:bg-overlay"
          >
            로그아웃
          </Button>
        </div>

        <Card>
          <h2 className="mb-2 font-display text-sm font-bold text-ink">회원 탈퇴</h2>
          <p className="mb-4 text-sm text-muted">
            계정을 삭제하면 모든 체험단 데이터가 함께 삭제되며 복구할 수 없습니다.
          </p>
          <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)} className="w-full">
            회원 탈퇴
          </Button>
        </Card>
      </div>
      {isDeleteModalOpen && (
        <DeleteAccountModal onClose={() => setIsDeleteModalOpen(false)} onDeleted={handleDeleted} />
      )}
      {isFeedbackOpen && (
        <FeedbackModal
          onClose={() => setIsFeedbackOpen(false)}
          onSubmitted={() => setFeedbackListKey((k) => k + 1)}
        />
      )}
    </div>
  )
}
