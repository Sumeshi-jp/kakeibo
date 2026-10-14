import { describe, expect, it } from 'vitest'
import { createAssetCalculator } from '../src/lib/balance'
import { billingCycleFor, buildStatements, clampedDate } from '../src/lib/cardBilling'
import type { Account, Card, Transaction } from '../src/types'

const card = (over: Partial<Card> = {}): Card => ({
  id: 'c1',
  name: 'カード',
  closingDay: 15,
  withdrawalDay: 10,
  withdrawalMonthOffset: 1,
  withdrawalAccountId: 'bank1',
  order: 0,
  archived: false,
  ...over,
})

const account = (over: Partial<Account> = {}): Account => ({
  id: 'bank1',
  name: '銀行',
  kind: 'bank',
  initialBalance: 100_000,
  initialDate: '2026-01-01',
  order: 0,
  archived: false,
  ...over,
})

let seq = 0
const tx = (over: Partial<Transaction>): Transaction => ({
  id: `t${seq++}`,
  type: 'expense',
  date: '2026-01-10',
  amount: 1000,
  categoryId: 'exp-food',
  source: { kind: 'bank', id: 'bank1' },
  memo: '',
  ...over,
})

describe('clampedDate', () => {
  it('月末より後の日付は末日にする', () => {
    expect(clampedDate(2026, 2, 31)).toBe('2026-02-28')
    expect(clampedDate(2028, 2, 31)).toBe('2028-02-29')
    expect(clampedDate(2026, 4, 31)).toBe('2026-04-30')
  })
  it('13月以降は翌年に繰り越す', () => {
    expect(clampedDate(2026, 13, 10)).toBe('2027-01-10')
    expect(clampedDate(2026, 14, 31)).toBe('2027-02-28')
  })
})

describe('billingCycleFor', () => {
  it('締め日当日の利用はその月の締めに入る', () => {
    expect(billingCycleFor(card(), '2026-03-15')).toEqual({
      closingDate: '2026-03-15',
      withdrawalDate: '2026-04-10',
      billingMonth: '2026-03',
    })
  })
  it('締め日の翌日の利用は翌月の締めに入る', () => {
    expect(billingCycleFor(card(), '2026-03-16')).toMatchObject({ closingDate: '2026-04-15', withdrawalDate: '2026-05-10' })
  })
  it('12月の締め後の利用は翌年に繰り越す', () => {
    expect(billingCycleFor(card(), '2026-12-20')).toMatchObject({ closingDate: '2027-01-15', withdrawalDate: '2027-02-10' })
  })
  it('月末締め・翌月27日払い', () => {
    const c = card({ closingDay: 31, withdrawalDay: 27 })
    expect(billingCycleFor(c, '2026-02-28')).toMatchObject({ closingDate: '2026-02-28', withdrawalDate: '2026-03-27' })
    expect(billingCycleFor(c, '2026-01-31')).toMatchObject({ closingDate: '2026-01-31', withdrawalDate: '2026-02-27' })
  })
  it('月末締め・翌々月4日払い', () => {
    const c = card({ closingDay: 31, withdrawalDay: 4, withdrawalMonthOffset: 2 })
    expect(billingCycleFor(c, '2026-11-30')).toMatchObject({ withdrawalDate: '2027-01-04' })
  })
})

describe('buildStatements', () => {
  it('締めごとに合計し、引き落とし日順に並べる', () => {
    const txs = [
      tx({ date: '2026-03-01', amount: 1000, source: { kind: 'card', id: 'c1' } }),
      tx({ date: '2026-03-15', amount: 2000, source: { kind: 'card', id: 'c1' } }),
      tx({ date: '2026-03-16', amount: 4000, source: { kind: 'card', id: 'c1' } }),
      tx({ date: '2026-03-02', amount: 9999 }), // 銀行払いは含めない
    ]
    const st = buildStatements([card()], txs)
    expect(st.map((s) => [s.withdrawalDate, s.amount])).toEqual([
      ['2026-04-10', 3000],
      ['2026-05-10', 4000],
    ])
  })
  it('補正額を優先し、利用のない月の補正も請求にする', () => {
    const txs = [tx({ date: '2026-03-01', amount: 1000, source: { kind: 'card', id: 'c1' } })]
    const st = buildStatements([card()], txs, { 'c1_2026-03': 1500, 'c1_2026-05': 1100 })
    expect(st.map((s) => [s.billingMonth, s.amount, s.computedAmount])).toEqual([
      ['2026-03', 1500, 1000],
      ['2026-05', 1100, 0],
    ])
  })
})

describe('createAssetCalculator', () => {
  const wallet = account({ id: 'cash1', name: '財布', kind: 'cash', initialBalance: 10_000 })
  const bank = account()

  it('収入・支出・振替を口座残高に反映する', () => {
    const txs = [
      tx({ type: 'income', amount: 300_000, categoryId: 'inc-salary', date: '2026-01-25' }),
      tx({ type: 'expense', amount: 2_000, source: { kind: 'cash', id: 'cash1' }, date: '2026-01-26' }),
      tx({ type: 'transfer', amount: 20_000, categoryId: null, date: '2026-01-27', to: { kind: 'cash', id: 'cash1' } }),
    ]
    const calc = createAssetCalculator([wallet, bank], [], txs)
    expect(calc.accountBalance(bank, '2026-01-31')).toBe(100_000 + 300_000 - 20_000)
    expect(calc.accountBalance(wallet, '2026-01-31')).toBe(10_000 - 2_000 + 20_000)
    expect(calc.snapshot('2026-01-31').net).toBe(408_000)
  })

  it('基準日より前の取引は残高に含めない（基準日当日は含める）', () => {
    const b = account({ initialDate: '2026-02-01' })
    const txs = [tx({ date: '2026-01-31', amount: 5000 }), tx({ date: '2026-02-01', amount: 700 })]
    const calc = createAssetCalculator([b], [], txs)
    expect(calc.accountBalance(b, '2026-02-10')).toBe(100_000 - 700)
  })

  it('カード払いは引き落とし日まで未払いとして資産から引き、引き落とし日に銀行から減らす', () => {
    const txs = [
      tx({ date: '2026-03-10', amount: 3000, source: { kind: 'card', id: 'c1' } }),
      tx({ date: '2026-03-20', amount: 5000, source: { kind: 'card', id: 'c1' } }),
    ]
    const calc = createAssetCalculator([bank], [card()], txs)

    // 3/12: 1件目のみ利用済み・未払い
    expect(calc.snapshot('2026-03-12')).toMatchObject({ bank: 100_000, cardUnpaid: 3000, net: 97_000 })
    // 3/31: 2件とも未払い（2件目は翌締め）
    expect(calc.snapshot('2026-03-31')).toMatchObject({ bank: 100_000, cardUnpaid: 8000, net: 92_000 })
    // 4/10: 1件目の請求が引き落とされる
    expect(calc.snapshot('2026-04-10')).toMatchObject({ bank: 97_000, cardUnpaid: 5000, net: 92_000 })
    // 5/10: すべて引き落とし済み
    expect(calc.snapshot('2026-05-10')).toMatchObject({ bank: 92_000, cardUnpaid: 0, net: 92_000 })
  })

  it('補正した請求額が引き落としと未払いに使われる', () => {
    const txs = [tx({ date: '2026-03-10', amount: 3000, source: { kind: 'card', id: 'c1' } })]
    const calc = createAssetCalculator([bank], [card()], txs, { 'c1_2026-03': 4100 })
    expect(calc.snapshot('2026-03-20').cardUnpaid).toBe(4100)
    expect(calc.accountBalance(bank, '2026-04-10')).toBe(100_000 - 4100)
  })

  it('月末ごとの資産推移を返す（最後は今日時点）', () => {
    const txs = [tx({ type: 'income', amount: 1000, categoryId: 'inc-salary', date: '2026-02-05' })]
    const calc = createAssetCalculator([bank], [], txs)
    expect(calc.monthly('2026-01', '2026-03-14').map((s) => [s.asOf, s.net])).toEqual([
      ['2026-01-31', 100_000],
      ['2026-02-28', 101_000],
      ['2026-03-14', 101_000],
    ])
  })

  it('今後の引き落とし予定を返す', () => {
    const txs = [tx({ date: '2026-03-10', amount: 3000, source: { kind: 'card', id: 'c1' } })]
    const calc = createAssetCalculator([bank], [card()], txs)
    expect(calc.upcoming('2026-03-31').map((s) => [s.withdrawalDate, s.amount])).toEqual([['2026-04-10', 3000]])
    expect(calc.upcoming('2026-04-10')).toEqual([])
  })
})
