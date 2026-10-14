import type { ReactNode } from 'react'

interface SectionEyebrowProps {
  children: ReactNode
  /** 見出しの右側に置く補足（リンクや合計など） */
  aside?: ReactNode
  as?: 'h2' | 'h3'
}

/** 細いゴールドの線 + セリフ体のセクション名。各セクションの冒頭に置く */
export function SectionEyebrow({ children, aside, as: Tag = 'h2' }: SectionEyebrowProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <Tag className="flex items-center gap-2.5 font-serif text-base font-semibold tracking-[0.08em] text-charcoal md:text-lg">
        <span aria-hidden className="h-px w-5 shrink-0 bg-marker" />
        <span>{children}</span>
      </Tag>
      {aside && <div className="text-sm text-slate">{aside}</div>}
    </div>
  )
}
