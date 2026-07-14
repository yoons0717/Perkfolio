import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import BlogLinkCard from '../components/BlogLinkCard'
import Button from '../components/Button'
import Card from '../components/Card'
import PageContainer from '../components/PageContainer'
import DeleteAccountModal from '../components/DeleteAccountModal'
import { signOut } from '../lib/auth'

export default function MyPage() {
  const navigate = useNavigate()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  async function handleDeleted() {
    // account is already gone at this point, so a signOut failure — whether
    // returned as { error } or thrown outright — shouldn't strand the user
    // on the delete modal; still navigate away, just log it for diagnostics
    try {
      const { error } = await signOut()
      if (error) console.error(error)
    } catch (err) {
      console.error(err)
    }
    navigate('/login')
  }

  return (
    <PageContainer>
      <div className="mb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="font-display text-2xl font-extrabold text-ink">마이페이지</h1>
      </div>
      <div className="flex flex-col gap-4">
        <BlogLinkCard />
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
    </PageContainer>
  )
}
