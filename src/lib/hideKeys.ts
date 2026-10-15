/**
 * 金額を隠せるのは次の種類だけ。それ以外の金額（明細・予算・カテゴリ別など）は常に表示する。
 * 同じキーの金額は、どの画面の目のマークで切り替えても一緒に切り替わる。
 */
export const HIDE_BALANCE = 'balance' // 収支（収入・支出・収支、月別の収支）
export const HIDE_CASH = 'cash' // 現金
export const HIDE_CARD = 'card' // クレカ（未払い額・引き落とし額）
export const HIDE_ASSETS = 'assets' // 総資産（資産推移グラフの目盛りも）

/** ヘッダーの一括切り替えの対象にしないキー（自分の目のマークだけで切り替える） */
export const INDEPENDENT_HIDE_KEYS: readonly string[] = [HIDE_ASSETS]
export const hideBankKey = (accountId: string) => `bank:${accountId}` // 銀行口座ごと
