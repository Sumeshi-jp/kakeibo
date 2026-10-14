import { getDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { format } from 'date-fns'
import { db } from '../lib/firebase'
import type { Account, Category } from '../types'
import { settingsDoc, userDoc } from './paths'

type Seed<T> = Omit<T, 'order' | 'archived'>

const expenseCategories: Seed<Category>[] = [
  { id: 'exp-food', name: '食費', type: 'expense', icon: 'utensils', color: '#c2410c' },
  { id: 'exp-daily', name: '日用品', type: 'expense', icon: 'shopping-basket', color: '#a16207' },
  { id: 'exp-transport', name: '交通', type: 'expense', icon: 'train-front', color: '#1d4ed8' },
  { id: 'exp-housing', name: '住居', type: 'expense', icon: 'house', color: '#4d7c0f' },
  { id: 'exp-utility', name: '水道光熱', type: 'expense', icon: 'zap', color: '#0e7490' },
  { id: 'exp-phone', name: '通信', type: 'expense', icon: 'smartphone', color: '#6d28d9' },
  { id: 'exp-fun', name: '娯楽', type: 'expense', icon: 'gamepad-2', color: '#be185d' },
  { id: 'exp-clothes', name: '衣服・美容', type: 'expense', icon: 'shirt', color: '#9333ea' },
  { id: 'exp-medical', name: '医療', type: 'expense', icon: 'stethoscope', color: '#047857' },
  { id: 'exp-social', name: '交際', type: 'expense', icon: 'users', color: '#b45309' },
  { id: 'exp-other', name: 'その他', type: 'expense', icon: 'ellipsis', color: '#595959' },
]

const incomeCategories: Seed<Category>[] = [
  { id: 'inc-salary', name: '給与', type: 'income', icon: 'briefcase', color: '#0f7f7a' },
  { id: 'inc-bonus', name: '賞与', type: 'income', icon: 'gift', color: '#0f766e' },
  { id: 'inc-side', name: '副収入', type: 'income', icon: 'coins', color: '#15803d' },
  { id: 'inc-other', name: 'その他', type: 'income', icon: 'ellipsis', color: '#595959' },
]

/**
 * 初回ログイン時に既定のカテゴリと「財布」口座を作る。
 * settings/main があれば作成済みとみなす。ID を固定しているので、PCとスマホで同時に実行されても重複しない。
 */
export async function seedIfNeeded(uid: string) {
  const settingsRef = settingsDoc(uid)
  if ((await getDoc(settingsRef)).exists()) return

  const batch = writeBatch(db)
  ;[...expenseCategories, ...incomeCategories].forEach(({ id, ...c }, i) => {
    batch.set(userDoc(uid, 'categories', id), { ...c, order: i, archived: false })
  })

  const wallet: Omit<Account, 'id'> = {
    name: '財布',
    kind: 'cash',
    initialBalance: 0,
    initialDate: format(new Date(), 'yyyy-MM-dd'),
    order: 0,
    archived: false,
  }
  batch.set(userDoc(uid, 'accounts', 'cash-wallet'), wallet)
  batch.set(settingsRef, { currency: 'JPY', weekStartsOn: 0, createdAt: serverTimestamp() })
  await batch.commit()
}
