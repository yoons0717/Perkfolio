import { useNavigate } from 'react-router-dom'
import BackButton from '../components/BackButton'
import PageContainer from '../components/PageContainer'
import VisitForm from '../components/VisitForm'
import { addVisit } from '../lib/visits'
import type { NewVisit } from '../types/visit'

export default function AddPage() {
  const navigate = useNavigate()

  async function handleSubmit(visit: NewVisit) {
    await addVisit(visit)
    navigate('/table')
  }

  return (
    <PageContainer>
      <div className="mb-4 flex items-center gap-3">
        <BackButton />
        <h1 className="font-display text-2xl font-extrabold text-ink">체험단 입력</h1>
      </div>
      <VisitForm onSubmit={handleSubmit} submitLabel="저장" pendingLabel="저장 중..." />
    </PageContainer>
  )
}
