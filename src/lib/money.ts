export const AMOUNT_MASK = '¥•••••'

const yen = new Intl.NumberFormat('ja-JP')

export type SignMode = 'none' | 'always' | 'negative'

/**
 * 円の整数を「¥12,345」形式にする。
 * hidden が true のときは金額を出さず AMOUNT_MASK を返す。
 */
export function formatYen(value: number, { sign = 'negative', hidden = false }: { sign?: SignMode; hidden?: boolean } = {}): string {
  if (hidden) return AMOUNT_MASK
  const abs = yen.format(Math.abs(Math.round(value)))
  if (sign === 'always' && value !== 0) return `${value < 0 ? '−' : '+'}¥${abs}`
  if (sign === 'negative' && value < 0) return `−¥${abs}`
  return `¥${abs}`
}
