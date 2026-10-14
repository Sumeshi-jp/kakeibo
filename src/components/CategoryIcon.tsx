import { Ellipsis } from 'lucide-react'
import { CATEGORY_ICONS } from '../lib/categoryIcons'

interface CategoryIconProps {
  icon: string
  color: string
  size?: 'sm' | 'md'
}

/** 色付きの丸に白抜きアイコン */
export function CategoryIcon({ icon, color, size = 'md' }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[icon] ?? Ellipsis
  const box = size === 'sm' ? 'size-7' : 'size-9'
  return (
    <span aria-hidden className={`grid ${box} shrink-0 place-items-center rounded-full text-white`} style={{ background: color }}>
      <Icon size={size === 'sm' ? 15 : 18} strokeWidth={2.2} />
    </span>
  )
}
