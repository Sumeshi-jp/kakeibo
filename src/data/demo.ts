/**
 * 開発用のデモモード。URL に ?demo を付けると Firebase の代わりにメモリ上のサンプルデータで動く。
 * import.meta.env.DEV が false の本番ビルドでは常に無効になる。
 */
import { addDays, format, subMonths } from 'date-fns'
import type { Account, Card, Category, Transaction } from '../types'
import type { CollectionName } from './paths'
import { expenseCategories, incomeCategories } from './seed'

export const DEMO = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('demo')

type Doc = { id: string } & Record<string, unknown>
const tables = new Map<CollectionName, Map<string, Doc>>()
const listeners = new Set<() => void>()
let version = 0

const table = (name: CollectionName) => {
  if (!tables.has(name)) tables.set(name, new Map())
  return tables.get(name)!
}
const emit = () => {
  version++
  listeners.forEach((l) => l())
}

export const demoStore = {
  subscribe(l: () => void) {
    listeners.add(l)
    return () => void listeners.delete(l)
  },
  version: () => version,
  all: <T>(name: CollectionName) => [...table(name).values()] as unknown as T[],
  set(name: CollectionName, id: string, data: Record<string, unknown>) {
    table(name).set(id, { ...data, id })
    emit()
  },
  update(name: CollectionName, id: string, data: Record<string, unknown>) {
    const cur = table(name).get(id)
    if (cur) table(name).set(id, { ...cur, ...data, id })
    emit()
  },
  remove(name: CollectionName, id: string) {
    table(name).delete(id)
    emit()
  },
  newId: () => Math.random().toString(36).slice(2, 12),
}

function seedDemo() {
  const today = new Date()
  const d = (date: Date) => format(date, 'yyyy-MM-dd')
  const start = subMonths(today, 5)
  start.setDate(1)

  const accounts: Account[] = [
    { id: 'cash-wallet', name: '財布', kind: 'cash', initialBalance: 12_000, initialDate: d(start), order: 0, archived: false },
    { id: 'bank-main', name: '三井住友 普通', kind: 'bank', initialBalance: 420_000, initialDate: d(start), order: 0, archived: false },
    { id: 'bank-sub', name: '楽天銀行', kind: 'bank', initialBalance: 150_000, initialDate: d(start), order: 1, archived: false },
  ]
  const cards: Card[] = [
    { id: 'card-r', name: '楽天カード', closingDay: 31, withdrawalDay: 27, withdrawalMonthOffset: 1, withdrawalAccountId: 'bank-sub', order: 0, archived: false },
    { id: 'card-s', name: '三井住友カード', closingDay: 15, withdrawalDay: 10, withdrawalMonthOffset: 1, withdrawalAccountId: 'bank-main', order: 1, archived: false },
  ]
  const categories: Category[] = [...expenseCategories, ...incomeCategories].map((c, i) => ({ ...c, order: i, archived: false }))

  accounts.forEach((a) => table('accounts').set(a.id, a as unknown as Doc))
  cards.forEach((c) => table('cards').set(c.id, c as unknown as Doc))
  categories.forEach((c) => table('categories').set(c.id, c as unknown as Doc))

  // 決まった並びで再現できる疑似乱数
  let r = 7
  const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280)
  const add = (t: Omit<Transaction, 'id'>) => {
    const id = demoStore.newId()
    table('transactions').set(id, { ...t, id } as unknown as Doc)
  }

  for (let day = new Date(start); day <= today; day = addDays(day, 1)) {
    const date = d(day)
    if (day.getDate() === 25) add({ type: 'income', date, amount: 285_000, categoryId: 'inc-salary', source: { kind: 'bank', id: 'bank-main' }, memo: '' })
    if (day.getDate() === 27) add({ type: 'expense', date, amount: 78_000, categoryId: 'exp-housing', source: { kind: 'bank', id: 'bank-main' }, memo: '家賃' })
    if (day.getDate() === 5) add({ type: 'expense', date, amount: 4_980, categoryId: 'exp-phone', source: { kind: 'card', id: 'card-r' }, memo: '' })
    if (day.getDate() === 12) add({ type: 'expense', date, amount: 6_000 + Math.round(rand() * 6000), categoryId: 'exp-utility', source: { kind: 'card', id: 'card-s' }, memo: '電気' })
    if (day.getDate() === 1) add({ type: 'transfer', date, amount: 30_000, categoryId: null, source: { kind: 'bank', id: 'bank-main' }, to: { kind: 'cash', id: 'cash-wallet' }, memo: 'ATM' })
    if (rand() < 0.7) add({ type: 'expense', date, amount: 300 + Math.round(rand() * 1800), categoryId: 'exp-food', source: rand() < 0.5 ? { kind: 'cash', id: 'cash-wallet' } : { kind: 'card', id: 'card-r' }, memo: rand() < 0.3 ? 'ランチ' : '' })
    if (rand() < 0.2) add({ type: 'expense', date, amount: 500 + Math.round(rand() * 3000), categoryId: 'exp-daily', source: { kind: 'card', id: 'card-r' }, memo: '' })
    if (rand() < 0.12) add({ type: 'expense', date, amount: 1000 + Math.round(rand() * 8000), categoryId: rand() < 0.5 ? 'exp-fun' : 'exp-social', source: { kind: 'card', id: 'card-s' }, memo: '' })
    if (rand() < 0.15) add({ type: 'expense', date, amount: 200 + Math.round(rand() * 800), categoryId: 'exp-transport', source: { kind: 'cash', id: 'cash-wallet' }, memo: '' })
  }
}

if (DEMO) seedDemo()
