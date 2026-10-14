import { useEffect } from 'react'
import { useLockStore } from './lockStore'
import { getPinConfig } from './pin'

/** バックグラウンドに回ってから一定時間たって戻ってきたらロックする */
export function useAutoLock() {
  useEffect(() => {
    let hiddenAt = 0
    const onChange = () => {
      const cfg = getPinConfig()
      if (!cfg) return
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        // すぐにロックする設定なら、アプリ切り替え画面に中身が映らないよう先にロックする
        if (cfg.lockAfterSec === 0) useLockStore.getState().lock()
      } else if (hiddenAt && Date.now() - hiddenAt >= cfg.lockAfterSec * 1000) {
        useLockStore.getState().lock()
      }
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
}
