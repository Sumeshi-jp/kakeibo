import type { Card, Transaction } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate() // m は 1-12

/** y年m月のd日。月末より後の日付（31日など）はその月の末日にする */
export function clampedDate(y: number, m: number, d: number): string {
  // 月をまたいだ指定（13月など）を正規化する
  const ny = y + Math.floor((m - 1) / 12)
  const nm = ((((m - 1) % 12) + 12) % 12) + 1
  return `${ny}-${pad(nm)}-${pad(Math.min(d, daysInMonth(ny, nm)))}`
}

export interface BillingCycle {
  /** 締め日（'YYYY-MM-DD'） */
  closingDate: string
  /** 引き落とし日（'YYYY-MM-DD'） */
  withdrawalDate: string
  /** 締め日の属する月（'YYYY-MM'）。請求の単位 */
  billingMonth: string
}

/** 利用日から、どの締めに入りいつ引き落とされるかを求める */
export function billingCycleFor(card: Pick<Card, 'closingDay' | 'withdrawalDay' | 'withdrawalMonthOffset'>, usageDate: string): BillingCycle {
  const [y, m] = usageDate.split('-').map(Number)
  let closingDate = clampedDate(y, m, card.closingDay)
  let cy = y
  let cm = m
  if (usageDate > closingDate) {
    cm += 1
    closingDate = clampedDate(cy, cm, card.closingDay)
    ;[cy, cm] = closingDate.split('-').map(Number)
  }
  return {
    closingDate,
    withdrawalDate: clampedDate(cy, cm + card.withdrawalMonthOffset, card.withdrawalDay),
    billingMonth: closingDate.slice(0, 7),
  }
}

export interface CardStatement extends BillingCycle {
  cardId: string
  /** 請求額（カード払いの支出の合計。補正があればその額） */
  amount: number
  /** 計算上の合計（補正前） */
  computedAmount: number
  /** この請求に入る利用（日付の昇順）。締め前の未払い額を日付ごとに求めるのに使う */
  usage: { date: string; amount: number }[]
}

/** カードごと・締めごとに支出を集計して請求一覧を作る（引き落とし日の昇順） */
export function buildStatements(
  cards: Card[],
  transactions: Transaction[],
  overrides: Record<string, number> = {},
): CardStatement[] {
  const cardMap = new Map(cards.map((c) => [c.id, c]))
  const byKey = new Map<string, CardStatement>()

  for (const tx of transactions) {
    if (tx.type !== 'expense' || tx.source.kind !== 'card') continue
    const card = cardMap.get(tx.source.id)
    if (!card) continue
    const cycle = billingCycleFor(card, tx.date)
    const key = `${card.id}_${cycle.billingMonth}`
    const st = byKey.get(key) ?? { ...cycle, cardId: card.id, amount: 0, computedAmount: 0, usage: [] }
    st.computedAmount += tx.amount
    st.usage.push({ date: tx.date, amount: tx.amount })
    byKey.set(key, st)
  }

  // 補正だけがあり利用のない月（年会費のみなど）も請求として扱う
  for (const key of Object.keys(overrides)) {
    if (byKey.has(key)) continue
    const [cardId, billingMonth] = key.split('_')
    const card = cardMap.get(cardId)
    if (!card) continue
    const [y, m] = billingMonth.split('-').map(Number)
    const closingDate = clampedDate(y, m, card.closingDay)
    byKey.set(key, {
      cardId,
      billingMonth,
      closingDate,
      withdrawalDate: clampedDate(y, m + card.withdrawalMonthOffset, card.withdrawalDay),
      amount: 0,
      computedAmount: 0,
      usage: [],
    })
  }

  return [...byKey.entries()]
    .map(([key, st]) => ({
      ...st,
      amount: overrides[key] ?? st.computedAmount,
      usage: st.usage.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .sort((a, b) => a.withdrawalDate.localeCompare(b.withdrawalDate))
}
