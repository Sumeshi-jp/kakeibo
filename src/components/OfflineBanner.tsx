import { WifiOff } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

/** オフライン中であることと、入力は後で同期されることを知らせる */
export function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine)
  if (online) return null
  return (
    <p role="status" className="flex items-center justify-center gap-2 bg-ink px-4 py-1.5 text-xs text-on-ink">
      <WifiOff size={14} /> オフラインです。入力した内容は接続したときに同期されます
    </p>
  )
}
