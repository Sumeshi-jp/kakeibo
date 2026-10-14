import { create } from 'zustand'
import { getPinConfig } from './pin'

interface LockState {
  /** PIN 画面を出しているか。PIN を設定していれば起動時はロックから始める */
  locked: boolean
  lock: () => void
  unlock: () => void
}

export const useLockStore = create<LockState>()((set) => ({
  locked: getPinConfig() !== null,
  lock: () => set({ locked: getPinConfig() !== null }),
  unlock: () => set({ locked: false }),
}))
