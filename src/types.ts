/** 金額はすべて円の整数。日付は 'YYYY-MM-DD' の文字列（タイムゾーンのずれを避けるため） */

export type AccountKind = 'cash' | 'bank'

export interface Account {
  id: string
  name: string
  kind: AccountKind
  /** initialDate 時点の残高 */
  initialBalance: number
  initialDate: string
  order: number
  archived: boolean
}

export interface Card {
  id: string
  name: string
  /** 締め日（1-31。31 は月末扱い） */
  closingDay: number
  /** 引き落とし日（1-31。31 は月末扱い） */
  withdrawalDay: number
  /** 締め日から何か月後に引き落とされるか（通常 1 = 翌月） */
  withdrawalMonthOffset: number
  withdrawalAccountId: string
  order: number
  archived: boolean
}

export type CategoryType = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  type: CategoryType
  /** lucide のアイコン名 */
  icon: string
  color: string
  /** 月の予算（支出カテゴリのみ。未設定は null） */
  budget?: number | null
  order: number
  archived: boolean
}

export type TransactionType = 'expense' | 'income' | 'transfer'

export interface MoneyRef {
  kind: AccountKind | 'card'
  id: string
}

export interface Transaction {
  id: string
  type: TransactionType
  date: string
  /** 正の整数 */
  amount: number
  /** 振替のときは null */
  categoryId: string | null
  /** 支払い元・入金先 */
  source: MoneyRef
  /** 振替先 */
  to?: { kind: AccountKind; id: string }
  memo: string
  recurringId?: string
}

/** 新規作成時に渡す形（id はFirestoreが決める） */
export type NewTransaction = Omit<Transaction, 'id'>

export type RecurringFrequency = 'monthly' | 'yearly'

/** 定期取引のルール。アプリを開いたときに、発生日を過ぎた分の明細を自動で作る */
export interface RecurringRule {
  id: string
  type: 'expense' | 'income'
  amount: number
  categoryId: string
  source: MoneyRef
  memo: string
  frequency: RecurringFrequency
  /** 毎月（毎年）何日か。31 は月末扱い */
  day: number
  /** 毎年の場合の月（1-12） */
  month?: number | null
  startDate: string
  endDate?: string | null
  /** ここまでの明細は作成済み（'YYYY-MM-DD'） */
  lastGeneratedDate?: string
  archived: boolean
  order: number
}
