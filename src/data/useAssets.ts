import { useMemo } from 'react'
import { createAssetCalculator } from '../lib/balance'
import { useAccounts, useAllTransactions, useCards } from './hooks'

/** 全期間の取引から残高・クレカ未払い・資産推移を計算する */
export function useAssets() {
  const accounts = useAccounts()
  const cards = useCards()
  const transactions = useAllTransactions()

  const calc = useMemo(
    () => createAssetCalculator(accounts.data, cards.data, transactions.data),
    [accounts.data, cards.data, transactions.data],
  )

  return {
    calc,
    accounts: accounts.data,
    cards: cards.data,
    transactions: transactions.data,
    loading: accounts.loading || cards.loading || transactions.loading,
  }
}
