import ConfirmModal from './ConfirmModal'
import { deleteProfile } from '../lib/profiles'

export default function UnlinkBlogModal({
  userId,
  onClose,
  onUnlinked,
}: {
  userId: string
  onClose: () => void
  onUnlinked: () => void
}) {
  return (
    <ConfirmModal
      title="블로그 삭제"
      description="삭제하면 등록된 블로그 주소가 사라져요. 언제든 다시 등록할 수 있어요."
      confirmLabel="삭제하기"
      pendingLabel="삭제 중..."
      errorFallback="삭제에 실패했습니다. 다시 시도해주세요."
      onClose={onClose}
      onConfirm={async () => {
        await deleteProfile(userId)
        onUnlinked()
      }}
    />
  )
}
