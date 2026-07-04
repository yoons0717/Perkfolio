import { deleteVisit } from '../lib/visits'

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
