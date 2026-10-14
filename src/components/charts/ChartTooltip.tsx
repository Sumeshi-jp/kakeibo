import { formatYen } from '../../lib/money'
import { useUiStore } from '../../store/uiStore'

export interface TooltipRow {
  label: string
  value: number
  color: string
}

/** グラフ共通のツールチップ。文字は文字色で書き、色は横の印で示す */
export function ChartTooltip({ title, rows }: { title: string; rows: TooltipRow[] }) {
  const hidden = useUiStore((s) => s.hideAmounts)
  return (
    <div className="min-w-36 border border-hairline bg-canvas px-3 py-2 text-sm">
      <p className="mb-1 font-bold">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-xs" style={{ background: r.color }} />
          <span className="flex-1 text-slate">{r.label}</span>
          <span className="tabular">{formatYen(r.value, { hidden })}</span>
        </p>
      ))}
    </div>
  )
}
