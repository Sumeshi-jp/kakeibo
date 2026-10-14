import { addMonths, endOfMonth, format, parseISO } from 'date-fns'
import type { Account, Card, Transaction } from '../types'
import { billingCycleFor, buildStatements, type CardStatement } from './cardBilling'

/** 口座残高の増減1件 */
interface Movement {
  date: string
  accountId: string
  delta: number
}

/** 取引とクレカの引き落としを、口座ごとの増減に変換する */
export function movements(transactions: Transaction[], statements: CardStatement[], cards: Card[]): Movement[] {
  const out: Movement[] = []
  for (const tx of transactions) {
    if (tx.source.kind === 'card') continue // カード払いは引き落とし時に口座へ反映する
    if (tx.type === 'expense') out.push({ date: tx.date, accountId: tx.source.id, delta: -tx.amount })
    else if (tx.type === 'income') out.push({ date: tx.date, accountId: tx.source.id, delta: tx.amount })
    else if (tx.to) {
      out.push({ date: tx.date, accountId: tx.source.id, delta: -tx.amount })
      out.push({ date: tx.date, accountId: tx.to.id, delta: tx.amount })
    }
  }
  const cardMap = new Map(cards.map((c) => [c.id, c]))
  for (const st of statements) {
    const card = cardMap.get(st.cardId)
    if (card && st.amount !== 0) out.push({ date: st.withdrawalDate, accountId: card.withdrawalAccountId, delta: -st.amount })
  }
  return out
}

/**
 * asOf 時点の口座残高。
 * 初期残高は「基準日の時点（その日の収支を記録する前）」の残高とみなし、基準日以降の増減を足す。
 */
export function accountBalance(account: Account, moves: Movement[], asOf: string): number {
  if (asOf < account.initialDate) return 0
  return moves.reduce(
    (sum, m) => (m.accountId === account.id && m.date >= account.initialDate && m.date <= asOf ? sum + m.delta : sum),
    account.initialBalance,
  )
}

/**
 * asOf 時点でまだ引き落とされていないカード利用額（カードごと）。
 * 締め済みの請求は請求額（補正があれば補正額）、締め前の請求は asOf までの利用額を数える。
 */
export function cardUnpaid(card: Card, transactions: Transaction[], statements: CardStatement[], asOf: string): number {
  let sum = 0
  for (const st of statements) {
    if (st.cardId !== card.id || st.withdrawalDate <= asOf) continue
    if (st.closingDate <= asOf) {
      sum += st.amount
      continue
    }
    for (const tx of transactions) {
      if (
        tx.type === 'expense' &&
        tx.source.kind === 'card' &&
        tx.source.id === card.id &&
        tx.date <= asOf &&
        billingCycleFor(card, tx.date).billingMonth === st.billingMonth
      ) {
        sum += tx.amount
      }
    }
  }
  return sum
}

export interface AssetSnapshot {
  asOf: string
  cash: number
  bank: number
  cardUnpaid: number
  /** 現金 + 銀行 − クレカ未払い */
  net: number
}

/** 資産計算に必要なものをまとめて受け取り、任意の日付の資産を返す関数を作る */
export function createAssetCalculator(accounts: Account[], cards: Card[], transactions: Transaction[], overrides: Record<string, number> = {}) {
  const statements = buildStatements(cards, transactions, overrides)
  const moves = movements(transactions, statements, cards)

  const snapshot = (asOf: string): AssetSnapshot => {
    let cash = 0
    let bank = 0
    for (const a of accounts) {
      const b = accountBalance(a, moves, asOf)
      if (a.kind === 'cash') cash += b
      else bank += b
    }
    const unpaid = cards.reduce((s, c) => s + cardUnpaid(c, transactions, statements, asOf), 0)
    return { asOf, cash, bank, cardUnpaid: unpaid, net: cash + bank - unpaid }
  }

  return {
    statements,
    snapshot,
    accountBalance: (a: Account, asOf: string) => accountBalance(a, moves, asOf),
    cardUnpaid: (c: Card, asOf: string) => cardUnpaid(c, transactions, statements, asOf),
    /** asOf より後に引き落とされる請求（直近順） */
    upcoming: (asOf: string) => statements.filter((s) => s.withdrawalDate > asOf && s.amount !== 0),
    /** 月末ごとの資産推移。最後の月は asOf（今日）時点 */
    monthly: (fromMonth: string, asOf: string): AssetSnapshot[] => {
      const out: AssetSnapshot[] = []
      for (let d = parseISO(`${fromMonth}-01`); format(d, 'yyyy-MM') <= asOf.slice(0, 7); d = addMonths(d, 1)) {
        const monthEnd = format(endOfMonth(d), 'yyyy-MM-dd')
        out.push(snapshot(monthEnd < asOf ? monthEnd : asOf))
      }
      return out
    },
  }
}
