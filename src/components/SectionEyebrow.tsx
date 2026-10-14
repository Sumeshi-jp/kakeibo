import type { ReactNode } from 'react'

interface SectionEyebrowProps {
  children: ReactNode
  /** 見出しの右側に置く補足（リンクや合計など） */
  aside?: ReactNode
  as?: 'h2' | 'h3'
}

/** オレンジのバー + 細字のセクション名。各セクションの冒頭に置く */
export function SectionEyebrow({ children, aside, as: Tag = 'h2' }: SectionEyebrowProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <Tag className="flex items-stretch gap-2.5 text-lg leading-tight font-light tracking-wide text-slate uppercase md:text-xl">
        <span aria-hidden className="w-2 shrink-0 bg-marker" />
        <span className="py-0.5">{children}</span>
      </Tag>
      {aside && <div className="text-sm text-slate">{aside}</div>}
    </div>
  )
}
