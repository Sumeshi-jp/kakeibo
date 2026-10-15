import { create } from 'zustand'
import { clearUnlocked, markUnlocked, stillUnlocked } from './lockSession'
import { getPinConfig } from './pin'

interface LockState {
  /** PIN 画面を出しているか */
  locked: boolean
  lock: () => void
  unlock: () => void
}

/** 起動時：PIN を設定していればロックから始める。ただし同じ起動中に解除済みなら（読み込み直しなど）解除のまま */
function initialLocked() {
  const cfg = getPinConfig()
  return cfg !== null && !stillUnlocked(cfg.lockAfterSec)
}

export const useLockStore = create<LockState>()((set) => ({
  locked: initialLocked(),
  lock: () => {
    clearUnlocked()
    set({ locked: getPinConfig() !== null })
  },
  unlock: () => {
    markUnlocked()
    set({ locked: false })
  },
}))
