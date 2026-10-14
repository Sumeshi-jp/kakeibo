import { formatYen, type SignMode } from '../lib/money'
import { useUiStore } from '../store/uiStore'

type Tone = 'plain' | 'expense' | 'income' | 'auto'

interface AmountProps {
  value: number
  sign?: SignMode
  /** auto: 正なら収入色、負なら支出色 */
  tone?: Tone
  className?: string
}

const toneClass: Record<Exclude<Tone, 'auto'>, string> = {
  plain: '',
  expense: 'text-expense',
  income: 'text-income',
}

/** 画面上の金額はすべてこの部品を通して表示する（金額を隠す設定に従うため） */
export function Amount({ value, sign = 'negative', tone = 'plain', className = '' }: AmountProps) {
  const hidden = useUiStore((s) => s.hideAmounts)
  const resolved = tone === 'auto' ? (value < 0 ? 'expense' : value > 0 ? 'income' : 'plain') : tone
  return (
    <span className={`tabular ${hidden ? '' : toneClass[resolved]} ${className}`}>
      {formatYen(value, { sign, hidden })}
    </span>
  )
}
