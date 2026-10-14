import { orderBy, query, where } from 'firebase/firestore'
import { useUid } from '../auth/useAuth'
import type { Account, Card, Category, Transaction } from '../types'
import { DEMO } from './demo'
import { userCol, type CollectionName } from './paths'
import { useCollection, type CollectionState } from './useCollection'
import { useDemoCollection } from './useDemoCollection'

/** 取得条件。order 順、または date 順（範囲指定つき） */
interface Spec {
  name: CollectionName
  sort: 'order' | 'date-asc' | 'date-desc'
  /** date の範囲（両端を含む、'YYYY-MM-DD'） */
  range?: [string, string]
}

function useFirestoreSpec<T extends { id: string }>(spec: Spec): CollectionState<T> {
  const uid = useUid()
  const { name, sort, range } = spec
  return useCollection<T>(() => {
    const col = userCol(uid, name)
    if (sort === 'order') return query(col, orderBy('order'))
    const dir = sort === 'date-desc' ? 'desc' : 'asc'
    return range
      ? query(col, where('date', '>=', range[0]), where('date', '<=', range[1]), orderBy('date', dir))
      : query(col, orderBy('date', dir))
  }, `${uid}/${name}/${sort}/${range?.join('~') ?? ''}`)
}

type Row = { id: string; order?: number; date?: string }

function useDemoSpec<T extends { id: string }>(spec: Spec): CollectionState<T> {
  const { name, sort, range } = spec
  return useDemoCollection<T>(name, (xs) => {
    const rows = xs as unknown as Row[]
    const filtered = range ? rows.filter((x) => x.date! >= range[0] && x.date! <= range[1]) : [...rows]
    if (sort === 'order') filtered.sort((a, b) => a.order! - b.order!)
    else filtered.sort((a, b) => (sort === 'date-asc' ? 1 : -1) * a.date!.localeCompare(b.date!))
    return filtered as unknown as T[]
  })
}

// 開発用のデモモード（?demo）ではメモリ上のデータを使う。起動時に一度だけ決まる
const useSpec = DEMO ? useDemoSpec : useFirestoreSpec

export const useAccounts = () => useSpec<Account>({ name: 'accounts', sort: 'order' })
export const useCards = () => useSpec<Card>({ name: 'cards', sort: 'order' })
export const useCategories = () => useSpec<Category>({ name: 'categories', sort: 'order' })

/** from〜to（両端を含む、'YYYY-MM-DD'）の取引を新しい順で取得する */
export const useTransactionsInRange = (from: string, to: string) =>
  useSpec<Transaction>({ name: 'transactions', sort: 'date-desc', range: [from, to] })

/** month: 'YYYY-MM' */
export const useTransactions = (month: string) => useTransactionsInRange(`${month}-01`, `${month}-31`)

/** 残高・資産推移の計算用に全期間の取引を取得する（オフラインキャッシュから読まれることが多い） */
export const useAllTransactions = () => useSpec<Transaction>({ name: 'transactions', sort: 'date-asc' })
