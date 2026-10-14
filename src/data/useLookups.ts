import { useMemo } from 'react'
import type { Account, Card, Category, MoneyRef } from '../types'
import { useAccounts, useCards, useCategories } from './hooks'

export interface Lookups {
  accounts: Account[]
  cards: Card[]
  categories: Category[]
  category: (id: string | null) => Category | undefined
  /** 支払い方法の表示名（口座名・カード名） */
  sourceName: (ref: MoneyRef | undefined) => string
  loading: boolean
}

/** 口座・カード・カテゴリをまとめて読み込み、id から引けるようにする */
export function useLookups(): Lookups {
  const accounts = useAccounts()
  const cards = useCards()
  const categories = useCategories()

  return useMemo(() => {
    const catMap = new Map(categories.data.map((c) => [c.id, c]))
    const accMap = new Map(accounts.data.map((a) => [a.id, a]))
    const cardMap = new Map(cards.data.map((c) => [c.id, c]))
    return {
      accounts: accounts.data,
      cards: cards.data,
      categories: categories.data,
      category: (id) => (id ? catMap.get(id) : undefined),
      sourceName: (ref) => {
        if (!ref) return ''
        const name = ref.kind === 'card' ? cardMap.get(ref.id)?.name : accMap.get(ref.id)?.name
        return name ?? '（削除された口座）'
      },
      loading: accounts.loading || cards.loading || categories.loading,
    }
  }, [accounts, cards, categories])
}
