import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import BlogLinkCard from '../components/BlogLinkCard'
import Button from '../components/Button'
import Card from '../components/Card'
import MyFeedbackCard from '../components/MyFeedbackCard'
import PageContainer from '../components/PageContainer'
import DeleteAccountModal from '../components/DeleteAccountModal'
import FeedbackModal from '../components/FeedbackModal'
import ThemeToggle from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../lib/admin'
import { signOut } from '../lib/auth'

export default function MyPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)

  async function handleDeleted() {
    // account is already gone at this point, so a signOut failure shouldn't
    // strand the user on the delete modal; still navigate away, just log it
    const { error } = await signOut()
    if (error) console.error(error)
    navigate('/login')
  }

  async function handleLogout() {
    const { error } = await signOut()
    if (error) {
      console.error(error)
      return
    }
    navigate('/login')
  }

  const showAdminLink = isAdmin(session?.user.app_metadata)

  return (
    <PageContainer>
      <div className="mb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="font-display text-2xl font-extrabold text-ink">마이페이지</h1>
      </div>
      <div className="flex flex-col gap-4">
        <BlogLinkCard />
        <MyFeedbackCard />

        <Card className="p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold text-ink">화면 테마</span>
            <ThemeToggle />
          </div>
          <div className="border-t border-line">
            <Button
              variant="ghost"
              onClick={() => setIsFeedbackOpen(true)}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-ink"
            >
              문의하기
            </Button>
          </div>
          {showAdminLink && (
            <div className="border-t border-line px-4 py-3">
              <Link to="/admin/feedback" className="block text-sm font-semibold text-ink">
                관리자 페이지
              </Link>
            </div>
          )}
          <div className="border-t border-line">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-danger"
            >
              로그아웃
            </Button>
          </div>
        </Card>

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
      {isFeedbackOpen && <FeedbackModal onClose={() => setIsFeedbackOpen(false)} />}
    </PageContainer>
  )
}
