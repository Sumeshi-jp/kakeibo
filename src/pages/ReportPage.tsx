import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Amount } from '../components/Amount'
import { CategoryBreakdown } from '../components/charts/CategoryBreakdown'
import { MonthlyBarChart, type MonthlyPoint } from '../components/charts/MonthlyBarChart'
import { Segmented } from '../components/fields'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { useTransactionsInRange } from '../data/hooks'
import { useLookups } from '../data/useLookups'
import { shiftMonth } from '../lib/dates'
import { totals, totalsByCategory } from '../lib/summary'
import { useUiStore } from '../store/uiStore'
import type { CategoryType } from '../types'

export default function ReportPage() {
  const month = useUiStore((s) => s.month)
  const lookups = useLookups()
  const [type, setType] = useState<CategoryType>('expense')
  const [showTable, setShowTable] = useState(false)

  // 表示中の月を含む直近12か月分をまとめて取得する
  const from = shiftMonth(month, -11)
  const { data: txs } = useTransactionsInRange(`${from}-01`, `${month}-31`)

  const monthTxs = txs.filter((t) => t.date.startsWith(month))
  const byCategory = totalsByCategory(monthTxs, type).map((t) => ({ category: lookups.category(t.categoryId), total: t.total }))

  const series: MonthlyPoint[] = Array.from({ length: 12 }, (_, i) => {
    const m = shiftMonth(from, i)
    const s = totals(txs.filter((t) => t.date.startsWith(m)))
    return { month: m, income: s.income, expense: s.expense }
  })

  return (
    <>
      <MonthSwitcher />
      <div className="grid gap-10 md:grid-cols-2">
        <section>
          <SectionEyebrow>カテゴリ別</SectionEyebrow>
          <div className="mb-4">
            <Segmented
              label="種類"
              value={type}
              onChange={setType}
              options={[
                { value: 'expense', label: '支出' },
                { value: 'income', label: '収入' },
              ]}
            />
          </div>
          <CategoryBreakdown totals={byCategory} emptyText={`この月の${type === 'expense' ? '支出' : '収入'}はまだありません`} />
        </section>

        <section>
          <SectionEyebrow>月別の収支</SectionEyebrow>
          <MonthlyBarChart data={series} />
          <button
            type="button"
            aria-expanded={showTable}
            onClick={() => setShowTable((v) => !v)}
            className="mt-2 flex min-h-11 items-center gap-1 text-sm text-slate"
          >
            <ChevronRight size={16} className={showTable ? 'rotate-90' : ''} />
            表で見る
          </button>
          {showTable && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink text-xs text-slate">
                  <th className="py-1.5 text-left font-normal">月</th>
                  <th className="py-1.5 text-right font-normal">収入</th>
                  <th className="py-1.5 text-right font-normal">支出</th>
                  <th className="py-1.5 text-right font-normal">収支</th>
                </tr>
              </thead>
              <tbody>
                {[...series].reverse().map((p) => (
                  <tr key={p.month} className="border-b border-hairline">
                    <td className="py-2 tabular">{p.month.replace('-', '/')}</td>
                    <td className="py-2 text-right"><Amount value={p.income} /></td>
                    <td className="py-2 text-right"><Amount value={p.expense} /></td>
                    <td className="py-2 text-right"><Amount value={p.income - p.expense} sign="always" tone="auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  )
}
