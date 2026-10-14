import { formatYen, type SignMode } from '../lib/money'
import { useHidden } from '../store/uiStore'
import { EyeToggle } from './EyeToggle'

type Tone = 'plain' | 'expense' | 'income' | 'auto'

interface AmountProps {
  value: number
  /** 表示／非表示を個別に覚えるためのキー。同じキーの金額は一緒に切り替わる */
  hideKey: string
  /** 横に目のマークを出すか（同じキーで別の場所にマークがある場合は false） */
  eye?: boolean
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
export function Amount({ value, hideKey, eye = true, sign = 'negative', tone = 'plain', className = '' }: AmountProps) {
  const hidden = useHidden(hideKey)
  const resolved = tone === 'auto' ? (value < 0 ? 'expense' : value > 0 ? 'income' : 'plain') : tone
  const text = (
    <span className={`tabular ${hidden ? '' : toneClass[resolved]} ${className}`}>{formatYen(value, { sign, hidden })}</span>
  )
  if (!eye) return text
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
      {text}
      <EyeToggle hideKey={hideKey} />
    </span>
  )
}
