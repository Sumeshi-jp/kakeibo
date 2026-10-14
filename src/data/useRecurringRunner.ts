import { useEffect } from 'react'
import { useUid } from '../auth/useAuth'
import { todayString } from '../lib/dates'
import { dueTransactions } from '../lib/recurring'
import { useUiStore } from '../store/uiStore'
import { useRecurring } from './hooks'
import { generateRecurring } from './mutations'

/** アプリを開いている間、定期取引のうち発生日を過ぎた分を明細として登録する */
export function useRecurringRunner() {
  const uid = useUid()
  const { data: rules, loading } = useRecurring()

  useEffect(() => {
    if (loading) return
    const today = todayString()
    let count = 0
    for (const rule of rules) {
      const due = dueTransactions(rule, today)
      count += due.length
      generateRecurring(uid, rule, due, today)
    }
    if (count > 0) useUiStore.getState().showToast(`定期取引を${count}件登録しました`)
  }, [uid, rules, loading])
}
