import { format } from 'date-fns'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { MoneyRef, Transaction } from '../types'

/** 入力シートの状態。new は新規（日付の初期値つき）、edit は既存の明細の編集 */
export type EntryState = { mode: 'new'; date?: string } | { mode: 'edit'; tx: Transaction } | null

interface UiState {
  /** 画面上の金額をすべて隠す（端末ごとの設定） */
  hideAmounts: boolean
  toggleHideAmounts: () => void
  /** 入力シート */
  entry: EntryState
  openEntry: (date?: string) => void
  editEntry: (tx: Transaction) => void
  closeEntry: () => void
  /** 前回使った支払い方法（次の入力の初期値にする） */
  lastSource: MoneyRef | null
  setLastSource: (ref: MoneyRef) => void
  /** ホーム・レポートで表示中の月（'YYYY-MM'） */
  month: string
  setMonth: (month: string) => void
  /** 画面下部に一時的に出すお知らせ */
  toast: { id: number; message: string; tone: 'info' | 'error' } | null
  showToast: (message: string, tone?: 'info' | 'error') => void
  clearToast: () => void
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
      entry: null,
      openEntry: (date) => set({ entry: { mode: 'new', date } }),
      editEntry: (tx) => set({ entry: { mode: 'edit', tx } }),
      closeEntry: () => set({ entry: null }),
      lastSource: null,
      setLastSource: (ref) => set({ lastSource: ref }),
      month: format(new Date(), 'yyyy-MM'),
      setMonth: (month) => set({ month }),
      toast: null,
      showToast: (message, tone = 'info') => set({ toast: { id: Date.now(), message, tone } }),
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'kakeibo-ui',
      storage: safeStorage,
      partialize: (s) => ({ hideAmounts: s.hideAmounts, lastSource: s.lastSource }),
    },
  ),
)
