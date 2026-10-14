import { Archive, ArchiveRestore } from 'lucide-react'
import { PillButton } from '../components/PillButton'

interface FormActionsProps {
  canSave: boolean
  /** 編集時のみ。アーカイブ状態を切り替える */
  archived?: boolean
  onToggleArchive?: () => void
}

export function FormActions({ canSave, archived, onToggleArchive }: FormActionsProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-hairline pt-4">
      <PillButton type="submit" block disabled={!canSave}>
        保存
      </PillButton>
      {onToggleArchive && (
        <PillButton variant="outline" block onClick={onToggleArchive}>
          {archived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
          {archived ? 'アーカイブから戻す' : 'アーカイブする（一覧に表示しない）'}
        </PillButton>
      )}
    </div>
  )
}
