import { addMonths, endOfMonth, format, parseISO } from 'date-fns'
import type { Account, Card, Transaction } from '../types'
import { buildStatements, type CardStatement } from './cardBilling'

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
 * 日付の昇順に並べた値の累計。「ある日付までの合計」を二分探索で O(log n) で求める。
 * 資産推移では月ごとに何十回も残高を求めるため、毎回すべての明細を数え直さないようにしている。
 */
class DatedSums {
  private dates: string[] = []
  private sums: number[] = [0]

  constructor(entries: { date: string; value: number }[]) {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    for (const e of sorted) {
      this.dates.push(e.date)
      this.sums.push(this.sums[this.sums.length - 1] + e.value)
    }
  }

  /** date 以下（その日を含む）の合計 */
  upTo(date: string): number {
    let lo = 0
    let hi = this.dates.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (this.dates[mid] <= date) lo = mid + 1
      else hi = mid
    }
    return this.sums[lo]
  }

  /** from より前（その日を含まない）の合計 */
  before(date: string): number {
    let lo = 0
    let hi = this.dates.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (this.dates[mid] < date) lo = mid + 1
      else hi = mid
    }
    return this.sums[lo]
  }
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

  // 口座ごとの増減の累計
  const movesByAccount = new Map<string, { date: string; value: number }[]>()
  for (const m of moves) {
    const list = movesByAccount.get(m.accountId) ?? []
    list.push({ date: m.date, value: m.delta })
    movesByAccount.set(m.accountId, list)
  }
  const accountSums = new Map([...movesByAccount].map(([id, list]) => [id, new DatedSums(list)]))

  // カードごとの請求と、請求ごとの利用の累計
  const statementsByCard = new Map<string, { st: CardStatement; usage: DatedSums }[]>()
  for (const st of statements) {
    const list = statementsByCard.get(st.cardId) ?? []
    list.push({ st, usage: new DatedSums(st.usage.map((u) => ({ date: u.date, value: u.amount }))) })
    statementsByCard.set(st.cardId, list)
  }

  /**
   * asOf 時点の口座残高。
   * 初期残高は「基準日の時点（その日の収支を記録する前）」の残高とみなし、基準日以降の増減を足す。
   */
  const accountBalance = (account: Account, asOf: string): number => {
    if (asOf < account.initialDate) return 0
    const sums = accountSums.get(account.id)
    return account.initialBalance + (sums ? sums.upTo(asOf) - sums.before(account.initialDate) : 0)
  }

  /**
   * asOf 時点でまだ引き落とされていないカード利用額。
   * 締め済みの請求は請求額（補正があれば補正額）、締め前の請求は asOf までの利用額を数える。
   */
  const cardUnpaid = (card: Card, asOf: string): number => {
    let sum = 0
    for (const { st, usage } of statementsByCard.get(card.id) ?? []) {
      if (st.withdrawalDate <= asOf) continue
      sum += st.closingDate <= asOf ? st.amount : usage.upTo(asOf)
    }
    return sum
  }

  const snapshot = (asOf: string): AssetSnapshot => {
    let cash = 0
    let bank = 0
    for (const a of accounts) {
      const b = accountBalance(a, asOf)
      if (a.kind === 'cash') cash += b
      else bank += b
    }
    const unpaid = cards.reduce((s, c) => s + cardUnpaid(c, asOf), 0)
    return { asOf, cash, bank, cardUnpaid: unpaid, net: cash + bank - unpaid }
  }

  return {
    statements,
    snapshot,
    accountBalance,
    cardUnpaid,
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
