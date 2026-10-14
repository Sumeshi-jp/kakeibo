import type { ButtonHTMLAttributes } from 'react'

type Variant = 'dark' | 'outline' | 'danger'

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  block?: boolean
}

const variants: Record<Variant, string> = {
  dark: 'bg-ink text-white hover:bg-charcoal',
  outline: 'border border-ink bg-canvas text-ink hover:bg-soft',
  danger: 'border border-expense bg-canvas text-expense hover:bg-soft',
}

/** 操作はすべて黒いピル型。オレンジは使わない */
export function PillButton({ variant = 'dark', block = false, className = '', type = 'button', ...rest }: PillButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-base leading-none font-medium tracking-wide transition-colors disabled:opacity-40 ${variants[variant]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  )
}
