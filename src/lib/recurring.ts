import { addDays, format, parseISO } from 'date-fns'
import type { NewTransaction, RecurringRule } from '../types'
import { clampedDate } from './cardBilling'

/** from〜to（両端を含む）の間にルールが発生する日付 */
export function occurrences(rule: Pick<RecurringRule, 'frequency' | 'day' | 'month'>, from: string, to: string): string[] {
  if (from > to) return []
  const out: string[] = []
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  if (rule.frequency === 'monthly') {
    for (let y = fy, m = fm; y < ty || (y === ty && m <= tm); m === 12 ? ((y += 1), (m = 1)) : (m += 1)) {
      const d = clampedDate(y, m, rule.day)
      if (d >= from && d <= to) out.push(d)
    }
  } else {
    for (let y = fy; y <= ty; y++) {
      const d = clampedDate(y, rule.month ?? 1, rule.day)
      if (d >= from && d <= to) out.push(d)
    }
  }
  return out
}

/** 今日までに作るべき明細（id は重複しないよう固定） */
export function dueTransactions(rule: RecurringRule, today: string): { id: string; tx: NewTransaction }[] {
  if (rule.archived) return []
  const from = rule.lastGeneratedDate ? format(addDays(parseISO(rule.lastGeneratedDate), 1), 'yyyy-MM-dd') : rule.startDate
  const to = rule.endDate && rule.endDate < today ? rule.endDate : today
  return occurrences(rule, from < rule.startDate ? rule.startDate : from, to).map((date) => ({
    id: `rec_${rule.id}_${date.replaceAll('-', '')}`,
    tx: {
      type: rule.type,
      date,
      amount: rule.amount,
      categoryId: rule.categoryId,
      source: rule.source,
      memo: rule.memo,
      recurringId: rule.id,
    },
  }))
}

export const frequencyLabel = (r: Pick<RecurringRule, 'frequency' | 'day' | 'month'>) => {
  const day = r.day >= 31 ? '月末' : `${r.day}日`
  return r.frequency === 'monthly' ? `毎月${day}` : `毎年${r.month ?? 1}月${day}`
}
