import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthHeading, shiftMonth, thisMonth } from '../lib/dates'
import { useUiStore } from '../store/uiStore'

export function MonthSwitcher() {
  const month = useUiStore((s) => s.month)
  const setMonth = useUiStore((s) => s.setMonth)
  const current = thisMonth()
  return (
    <div className="mb-5 flex items-center justify-between border-b border-ink pb-2">
      <button type="button" aria-label="前の月" onClick={() => setMonth(shiftMonth(month, -1))} className="grid size-11 place-items-center rounded-full hover:bg-soft">
        <ChevronLeft size={22} />
      </button>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold tabular">{monthHeading(month)}</h2>
        {month !== current && (
          <button type="button" onClick={() => setMonth(current)} className="min-h-8 rounded-lg border border-ink px-3 text-xs">
            今月
          </button>
        )}
      </div>
      <button type="button" aria-label="次の月" onClick={() => setMonth(shiftMonth(month, 1))} className="grid size-11 place-items-center rounded-full hover:bg-soft">
        <ChevronRight size={22} />
      </button>
    </div>
  )
}
