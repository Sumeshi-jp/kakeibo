import type { ReactNode } from 'react'
import type { Category } from '../types'
import { Amount } from './Amount'
import { CategoryIcon } from './CategoryIcon'

interface BudgetListProps {
  categories: Category[]
  /** カテゴリ id → その月の支出合計 */
  spent: Map<string | null, number>
}

/** 予算を設定した支出カテゴリの、使った額と残り */
export function BudgetList({ categories, spent }: BudgetListProps) {
  const budgeted = categories.filter((c) => c.type === 'expense' && !c.archived && (c.budget ?? 0) > 0)
  if (budgeted.length === 0) {
    return <p className="border-b border-hairline py-6 text-center text-sm text-slate">設定画面のカテゴリから月の予算を設定できます</p>
  }
  const totalBudget = budgeted.reduce((s, c) => s + (c.budget ?? 0), 0)
  const totalSpent = budgeted.reduce((s, c) => s + (spent.get(c.id) ?? 0), 0)

  const row = (key: string, label: ReactNode, used: number, budget: number, color: string) => {
    const over = used > budget
    const ratio = Math.min(used / budget, 1)
    return (
      <li key={key} className="border-b border-hairline py-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="flex min-w-0 flex-1 items-center gap-2">{label}</span>
          <span className="shrink-0 tabular">
            <Amount value={used} className="font-bold" />
            <span className="text-slate"> / </span>
            <Amount value={budget} className="text-slate" />
          </span>
        </div>
        <div className="mt-1.5 h-1.5 bg-soft" role="presentation">
          <div className="h-full rounded-r-xs" style={{ width: `${ratio * 100}%`, background: over ? 'var(--color-expense-mark)' : color }} />
        </div>
        <p className={`mt-1 text-right text-xs ${over ? 'font-bold text-expense' : 'text-slate'}`}>
          {over ? (
            <>
              <Amount value={used - budget} /> 超過
            </>
          ) : (
            <>
              残り <Amount value={budget - used} />
            </>
          )}
        </p>
      </li>
    )
  }

  return (
    <ul>
      {row('total', <span className="font-bold">合計</span>, totalSpent, totalBudget, 'var(--color-ink)')}
      {budgeted.map((c) =>
        row(
          c.id,
          <>
            <CategoryIcon icon={c.icon} color={c.color} size="sm" />
            <span className="truncate">{c.name}</span>
          </>,
          spent.get(c.id) ?? 0,
          c.budget ?? 0,
          c.color,
        ),
      )}
    </ul>
  )
}
