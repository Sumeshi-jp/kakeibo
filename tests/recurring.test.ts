import { describe, expect, it } from 'vitest'
import { dueTransactions, occurrences } from '../src/lib/recurring'
import type { RecurringRule } from '../src/types'

const rule = (over: Partial<RecurringRule> = {}): RecurringRule => ({
  id: 'r1',
  type: 'expense',
  amount: 78000,
  categoryId: 'exp-housing',
  source: { kind: 'bank', id: 'b1' },
  memo: '家賃',
  frequency: 'monthly',
  day: 27,
  startDate: '2026-01-01',
  archived: false,
  order: 0,
  ...over,
})

describe('occurrences', () => {
  it('毎月の発生日を範囲内で返す（年をまたぐ）', () => {
    expect(occurrences(rule(), '2026-11-28', '2027-02-27')).toEqual(['2026-12-27', '2027-01-27', '2027-02-27'])
  })
  it('31日指定は各月の末日になる', () => {
    expect(occurrences(rule({ day: 31 }), '2026-01-01', '2026-04-30')).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30'])
  })
  it('毎年の発生日', () => {
    expect(occurrences(rule({ frequency: 'yearly', month: 4, day: 1 }), '2026-01-01', '2028-03-31')).toEqual(['2026-04-01', '2027-04-01'])
  })
})

describe('dueTransactions', () => {
  it('開始日から今日までの分を、固定の id で作る', () => {
    const due = dueTransactions(rule(), '2026-03-10')
    expect(due.map((d) => d.id)).toEqual(['rec_r1_20260127', 'rec_r1_20260227'])
    expect(due[0].tx).toMatchObject({ date: '2026-01-27', amount: 78000, recurringId: 'r1', memo: '家賃' })
  })
  it('作成済みの日付の翌日から作る', () => {
    expect(dueTransactions(rule({ lastGeneratedDate: '2026-02-27' }), '2026-03-31').map((d) => d.tx.date)).toEqual(['2026-03-27'])
  })
  it('終了日以降とアーカイブ済みは作らない', () => {
    expect(dueTransactions(rule({ endDate: '2026-02-01' }), '2026-12-31').map((d) => d.tx.date)).toEqual(['2026-01-27'])
    expect(dueTransactions(rule({ archived: true }), '2026-12-31')).toEqual([])
  })
})
