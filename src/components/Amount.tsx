import { formatYen, type SignMode } from '../lib/money'
import { useHidden } from '../store/uiStore'
import { EyeToggle } from './EyeToggle'

type Tone = 'plain' | 'expense' | 'income' | 'auto'

interface AmountProps {
  value: number
  /**
   * 隠せる金額のキー（lib/hideKeys）。指定しない金額は常に表示する。
   * 同じキーの金額は一緒に切り替わる。
   */
  hideKey?: string
  /** 横に目のマークを出すか（同じキーのマークが近くにある場合は false） */
  eye?: boolean
  /** キーによらず隠すかを直接指定する（総資産など、複数のキーから決まるもの） */
  hidden?: boolean
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

/** 画面上の金額はすべてこの部品を通して表示する */
export function Amount({ value, hideKey, eye = true, hidden: forced, sign = 'negative', tone = 'plain', className = '' }: AmountProps) {
  const keyHidden = useHidden(hideKey)
  const hidden = forced ?? (hideKey ? keyHidden : false)
  const resolved = tone === 'auto' ? (value < 0 ? 'expense' : value > 0 ? 'income' : 'plain') : tone
  const text = (
    <span className={`tabular ${hidden ? '' : toneClass[resolved]} ${className}`}>{formatYen(value, { sign, hidden })}</span>
  )
  if (!hideKey || !eye || forced !== undefined) return text
  return (
    <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
      {text}
      <EyeToggle hideKey={hideKey} />
    </span>
  )
}
