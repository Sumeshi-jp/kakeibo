import type { CategoryType, Transaction } from '../types'

/** 収入・支出の合計（振替は含めない） */
export function totals(txs: Transaction[]) {
  let income = 0
  let expense = 0
  for (const t of txs) {
    if (t.type === 'income') income += t.amount
    else if (t.type === 'expense') expense += t.amount
  }
  return { income, expense, balance: income - expense }
}

/** カテゴリごとの合計（多い順） */
export function totalsByCategory(txs: Transaction[], type: CategoryType) {
  const map = new Map<string | null, number>()
  for (const t of txs) if (t.type === type) map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  return [...map].map(([categoryId, total]) => ({ categoryId, total })).sort((a, b) => b.total - a.total)
}

/** 日付ごとの収入・支出 */
export function totalsByDay(txs: Transaction[]) {
  const map = new Map<string, { income: number; expense: number }>()
  for (const t of txs) {
    if (t.type === 'transfer') continue
    const d = map.get(t.date) ?? { income: 0, expense: 0 }
    d[t.type] += t.amount
    map.set(t.date, d)
  }
  return map
}

/** 収支への影響（支出はマイナス、振替は 0） */
export const signedAmount = (tx: Transaction) => (tx.type === 'income' ? tx.amount : tx.type === 'expense' ? -tx.amount : 0)
