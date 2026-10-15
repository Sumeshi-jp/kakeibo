import { Eye, EyeOff } from 'lucide-react'
import { useHidden, useUiStore } from '../store/uiStore'

/** 金額の横に置く、その金額だけを表示／非表示にするボタン */
export function EyeToggle({ hideKey, className = '' }: { hideKey: string; className?: string }) {
  const hidden = useHidden(hideKey)
  const toggle = useUiStore((s) => s.toggleHidden)
  const Icon = hidden ? EyeOff : Eye
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        toggle(hideKey)
      }}
      aria-pressed={hidden}
      aria-label={hidden ? '金額を表示する' : '金額を隠す'}
      className={`hit-44 -my-1 inline-grid size-8 shrink-0 place-items-center rounded-full text-slate hover:bg-soft ${className}`}
    >
      <Icon size={15} />
    </button>
  )
}
