import type { RecurringFrequency, TransactionType } from '../types'

/** 収支入力の途中の内容。入力シートを閉じても消えないよう端末に一時保存する */
export interface EntryDraft {
  type: TransactionType
  amount: number
  date: string
  categoryId: string | null
  source: string
  to: string
  memo: string
  repeat: 'none' | RecurringFrequency
  savedAt: number
}

const KEY = 'kakeibo-entry-draft'
/** 古すぎる下書きは使わない */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** 何か入力されているか（何も入れていなければ保存しない） */
export const hasContent = (d: Pick<EntryDraft, 'amount' | 'memo' | 'categoryId'>) => d.amount > 0 || d.memo.trim() !== '' || d.categoryId !== null

export function loadDraft(now = Date.now()): EntryDraft | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as EntryDraft
    return now - d.savedAt < MAX_AGE_MS && hasContent(d) ? d : null
  } catch {
    return null
  }
}

export function saveDraft(d: Omit<EntryDraft, 'savedAt'>) {
  try {
    if (hasContent(d)) localStorage.setItem(KEY, JSON.stringify({ ...d, savedAt: Date.now() }))
    else localStorage.removeItem(KEY)
  } catch {
    /* 保存できない環境では一時保存しない */
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}
