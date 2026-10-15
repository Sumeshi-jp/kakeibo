import { useEffect } from 'react'
import { clearHidden, hiddenAt, markHidden } from './lockSession'
import { useLockStore } from './lockStore'
import { getPinConfig } from './pin'

/** バックグラウンドに回ってから一定時間たって戻ってきたらロックする */
export function useAutoLock() {
  useEffect(() => {
    const onChange = () => {
      const cfg = getPinConfig()
      if (!cfg) return
      if (document.visibilityState === 'hidden') {
        markHidden(Date.now())
        // すぐにロックする設定なら、アプリ切り替え画面に中身が映らないよう先にロックする
        if (cfg.lockAfterSec === 0) useLockStore.getState().lock()
      } else {
        const at = hiddenAt()
        if (at && Date.now() - at >= cfg.lockAfterSec * 1000) useLockStore.getState().lock()
        clearHidden()
      }
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
}
