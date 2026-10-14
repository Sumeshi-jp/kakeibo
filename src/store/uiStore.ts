import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UiState {
  /** 画面上の金額をすべて隠す（端末ごとの設定） */
  hideAmounts: boolean
  toggleHideAmounts: () => void
  /** 入力シートの開閉 */
  entryOpen: boolean
  openEntry: () => void
  closeEntry: () => void
}

// localStorage が使えない環境（プライベートブラウズ等）でも落ちないようにする
const safeStorage = createJSONStorage(() => {
  try {
    const probe = '__kakeibo_probe__'
    localStorage.setItem(probe, probe)
    localStorage.removeItem(probe)
    return localStorage
  } catch {
    const mem = new Map<string, string>()
    return {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
    }
  }
})

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      hideAmounts: false,
      toggleHideAmounts: () => set((s) => ({ hideAmounts: !s.hideAmounts })),
      entryOpen: false,
      openEntry: () => set({ entryOpen: true }),
      closeEntry: () => set({ entryOpen: false }),
    }),
    {
      name: 'kakeibo-ui',
      storage: safeStorage,
      partialize: (s) => ({ hideAmounts: s.hideAmounts }),
    },
  ),
)
