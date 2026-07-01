import { useNavigate } from 'react-router-dom'
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
    <div className="mx-auto mt-10 w-full max-w-lg px-4">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">체험단 방문 입력</h1>
      <VisitForm onSubmit={handleSubmit} submitLabel="저장" pendingLabel="저장 중..." />
    </div>
  )
}
