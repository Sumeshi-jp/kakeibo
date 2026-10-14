import { orderBy, query, where } from 'firebase/firestore'
import { useUid } from '../auth/useAuth'
import type { Account, Card, Category, Transaction } from '../types'
import { userCol } from './paths'
import { useCollection } from './useCollection'

export function useAccounts() {
  const uid = useUid()
  return useCollection<Account>(() => query(userCol(uid, 'accounts'), orderBy('order')), `${uid}/accounts`)
}

export function useCards() {
  const uid = useUid()
  return useCollection<Card>(() => query(userCol(uid, 'cards'), orderBy('order')), `${uid}/cards`)
}

export function useCategories() {
  const uid = useUid()
  return useCollection<Category>(() => query(userCol(uid, 'categories'), orderBy('order')), `${uid}/categories`)
}

/** from〜to（両端を含む、'YYYY-MM-DD'）の取引を新しい順で取得する */
export function useTransactionsInRange(from: string, to: string) {
  const uid = useUid()
  return useCollection<Transaction>(
    () =>
      query(userCol(uid, 'transactions'), where('date', '>=', from), where('date', '<=', to), orderBy('date', 'desc')),
    `${uid}/transactions/${from}/${to}`,
  )
}

/** month: 'YYYY-MM' */
export function useTransactions(month: string) {
  return useTransactionsInRange(`${month}-01`, `${month}-31`)
}

/** 残高・資産推移の計算用に全期間の取引を取得する（オフラインキャッシュから読まれることが多い） */
export function useAllTransactions() {
  const uid = useUid()
  return useCollection<Transaction>(
    () => query(userCol(uid, 'transactions'), orderBy('date')),
    `${uid}/transactions/all`,
  )
}
