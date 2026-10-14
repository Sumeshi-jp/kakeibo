import { forwardRef, type InputHTMLAttributes } from 'react'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

/** カプセル型の入力欄。ラベルは常に表示する */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, id, className = '', autoFocus, ...rest },
  ref,
) {
  const inputId = id ?? `in-${label}`
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1 block text-sm text-slate">{label}</span>
      <input
        ref={ref}
        id={inputId}
        data-autofocus={autoFocus || undefined}
        className={`h-11 w-full rounded-xl border border-slate bg-canvas px-4 text-base outline-none focus:border-ink focus:ring-1 focus:ring-ink ${className}`}
        {...rest}
      />
    </label>
  )
})
