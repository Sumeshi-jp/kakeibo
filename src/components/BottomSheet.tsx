import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/** スマホでは下から出るシート、PCでは中央のダイアログとして表示する */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // ブラウザ側（Esc キーなど）で閉じられた場合も確実に親へ伝える
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const handle = () => onCloseRef.current()
    dialog.addEventListener('close', handle)
    return () => dialog.removeEventListener('close', handle)
  }, [])

  // 表示状態を毎回 open に合わせる（開いたまま内容だけ変わった場合も含む）
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // showModal は最初のボタン（閉じる）にフォーカスを移すので、入力欄に移し直す
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    if (!open && dialog.open) dialog.close()
  })

  return (
    <dialog
      ref={ref}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="sheet flex-col overflow-hidden rounded-t-xl bg-canvas p-0 text-ink open:flex backdrop:bg-black/40 md:rounded-xl"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-hairline px-4 py-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="grid size-11 place-items-center rounded-full hover:bg-soft"
        >
          <X size={22} />
        </button>
      </div>
      <div className="min-h-0 flex-1 touch-pan-y overflow-x-hidden overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  )
}
