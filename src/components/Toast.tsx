import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

export function Toast() {
  const toast = useUiStore((s) => s.toast)
  const clear = useUiStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(clear, toast.tone === 'error' ? 6000 : 3000)
    return () => clearTimeout(t)
  }, [toast, clear])

  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-8">
      <p
        role={toast.tone === 'error' ? 'alert' : 'status'}
        className={`rounded-sm px-4 py-2.5 text-sm text-white ${toast.tone === 'error' ? 'bg-expense' : 'bg-ink'}`}
      >
        {toast.message}
      </p>
    </div>
  )
}
