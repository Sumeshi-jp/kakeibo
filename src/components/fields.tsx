import { ChevronDown } from 'lucide-react'
import type { ReactNode, SelectHTMLAttributes } from 'react'

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

/** 金額をカンマ付きで入力する欄。value は円の整数 */
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
  const text = value === 0 ? '' : new Intl.NumberFormat('ja-JP').format(value)
  return (
    <FieldLabel label={label} htmlFor={id}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate">¥</span>
        <input
          id={id}
          inputMode={allowNegative ? 'text' : 'numeric'}
          data-autofocus={autoFocus || undefined}
          autoComplete="off"
          placeholder="0"
          value={text}
          onChange={(e) => {
            const raw = e.target.value.replace(/[,，\s]/g, '').replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
            const neg = allowNegative && /^[-−ー]/.test(raw)
            const digits = raw.replace(/\D/g, '')
            const n = digits ? Number(digits) : 0
            onChange(neg ? -n : n)
          }}
          className={`${fieldFrame} tabular pl-9 text-right ${size === 'lg' ? 'h-14 text-3xl font-bold' : 'h-11 text-base'}`}
        />
      </div>
    </FieldLabel>
  )
}
