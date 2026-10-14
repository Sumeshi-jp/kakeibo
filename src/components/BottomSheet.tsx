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

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-xl bg-canvas p-0 text-ink backdrop:bg-black/40 md:m-auto md:max-w-lg md:rounded-xl"
    >
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
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
      <div className="overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  )
}
