import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { deleteVisit, toggleStatus } from '../lib/visits'
import type { Visit } from '../types/visit'

export async function confirmAndDelete(
  id: string,
  confirmMessage: string,
  onSuccess: () => void,
  onError: (message: string) => void,
) {
  if (!window.confirm(confirmMessage)) return
  try {
    await deleteVisit(id)
    onSuccess()
  } catch (err) {
    console.error(err)
    onError('삭제에 실패했습니다.')
  }
}

export function useVisitActions(setVisits: Dispatch<SetStateAction<Visit[]>>) {
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleToggleStatus(e: React.MouseEvent, v: Visit) {
    e.stopPropagation()
    try {
      const updated = await toggleStatus(v.id, v.status)
      setVisits((prev) => prev.map((item) => (item.id === v.id ? updated : item)))
      setActionError(null)
    } catch (err) {
      console.error(err)
      setActionError('상태 변경에 실패했습니다.')
    }
  }

  async function handleDelete(e: React.MouseEvent, v: Visit, confirmMessage: string) {
    e.stopPropagation()
    await confirmAndDelete(
      v.id,
      confirmMessage,
      () => {
        setVisits((prev) => prev.filter((item) => item.id !== v.id))
        setActionError(null)
      },
      setActionError,
    )
  }

  return { actionError, handleToggleStatus, handleDelete }
}
