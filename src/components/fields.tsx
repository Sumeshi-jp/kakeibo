import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode, SelectHTMLAttributes } from 'react'
import { parseYenInput } from '../lib/money'

const yenFormat = new Intl.NumberFormat('ja-JP')

const fieldFrame = 'w-full rounded-xl border border-slate bg-canvas px-4 outline-none focus:border-ink focus:ring-1 focus:ring-ink'
const fieldBox = `${fieldFrame} h-11 text-base`

export function FieldLabel({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1 block text-sm text-slate">{label}</span>
      {children}
    </label>
  )
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
}

export function SelectField({ label, id, children, ...rest }: SelectFieldProps) {
  const selectId = id ?? `sel-${label}`
  return (
    <FieldLabel label={label} htmlFor={selectId}>
      <div className="relative">
        <select id={selectId} className={`${fieldBox} appearance-none pr-10`} {...rest}>
          {children}
        </select>
        <ChevronDown aria-hidden size={18} className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-slate" />
      </div>
    </FieldLabel>
  )
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}

/** 2〜3択の切り替え */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm text-slate">{label}</legend>
      <div className="flex rounded-xl border border-ink p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`min-h-10 flex-1 rounded-[20px] text-sm ${value === o.value ? 'bg-ink font-bold text-on-ink' : 'text-ink'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * 金額の入力欄。value は円の整数。
 * 入力中は打った文字をそのまま表示し（カンマを足すなどの書き換えをしない）、欄を離れたらカンマ区切りにする。
 * 入力中に書き換えると、iPhone のキーボード（特に日本語入力の確定前）と取り合いになり、
 * 同じ数字が連続で入ったりカーソルが飛んだりするため。
 */
export function YenInput({
  label,
  value,
  onChange,
  allowNegative = false,
  size = 'md',
  autoFocus,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  allowNegative?: boolean
  size?: 'md' | 'lg'
  autoFocus?: boolean
}) {
  const id = `yen-${label}`
  // 入力中だけ使う、打ったままの文字列（null のときは value をカンマ区切りで表示）
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? (value === 0 ? '' : yenFormat.format(value))

  return (
    <FieldLabel label={label} htmlFor={id}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate">¥</span>
        <input
          id={id}
          type="text"
          inputMode={allowNegative ? 'text' : 'numeric'}
          enterKeyHint="done"
          data-autofocus={autoFocus || undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="0"
          value={display}
          onFocus={() => setDraft(value === 0 ? '' : String(value))}
          onChange={(e) => {
            setDraft(e.target.value)
            onChange(parseYenInput(e.target.value, allowNegative))
          }}
          onBlur={() => setDraft(null)}
          className={`${fieldFrame} tabular pl-9 text-right ${size === 'lg' ? 'h-14 text-3xl font-bold' : 'h-11 text-base'}`}
        />
      </div>
    </FieldLabel>
  )
}
