import ConfirmModal from './ConfirmModal'
import { deleteAccount } from '../lib/auth'

export default function DeleteAccountModal({
  onClose,
  onDeleted,
}: {
  onClose: () => void
  onDeleted: () => void
}) {
  return (
    <ConfirmModal
      title="회원 탈퇴"
      description="정말 탈퇴하시겠어요? 모든 데이터가 삭제되며 복구할 수 없습니다."
      confirmLabel="탈퇴하기"
      pendingLabel="탈퇴 중..."
      errorFallback="회원 탈퇴에 실패했습니다. 다시 시도해주세요."
      onClose={onClose}
      onConfirm={async () => {
        await deleteAccount()
        onDeleted()
      }}
    />
  )
}
