import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Category } from '../../types'
import { Amount } from '../Amount'
import { CategoryIcon } from '../CategoryIcon'
import { ChartTooltip } from './ChartTooltip'

export interface CategoryTotal {
  category: Category | undefined
  total: number
}

/**
 * カテゴリ別の内訳。ドーナツ + 名前つきの順位表。
 * カテゴリの色は自分で選ぶため似た色が並ぶことがある。表で名前を必ず添え、色だけで区別させない。
 */
export function CategoryBreakdown({ totals, emptyText }: { totals: CategoryTotal[]; emptyText: string }) {
  const sum = totals.reduce((s, t) => s + t.total, 0)
  if (sum === 0) return <p className="border-b border-hairline py-6 text-center text-sm text-slate">{emptyText}</p>

  const rows = totals.map((t) => ({
    key: `report:cat:${t.category?.id ?? 'none'}`,
    name: t.category?.name ?? '未分類',
    color: t.category?.color ?? '#595959',
    icon: t.category?.icon ?? 'ellipsis',
    total: t.total,
    share: t.total / sum,
  }))
  const max = rows[0]?.total ?? 1

  return (
    <div className="grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
      <div className="relative mx-auto size-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="total"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="var(--color-canvas)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {rows.map((r) => (
                <Cell key={r.name} fill={r.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <ChartTooltip
                    hidden={false}
                    title={`${payload[0].payload.name}（${Math.round(payload[0].payload.share * 100)}%）`}
                    rows={[{ label: '金額', value: Number(payload[0].payload.total), color: payload[0].payload.color }]}
                  />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-slate">合計</p>
            <Amount value={sum} className="text-lg font-bold" />
          </div>
        </div>
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">カテゴリ別の金額と割合</caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-b border-hairline">
              <td className="w-8 py-2">
                <CategoryIcon icon={r.icon} color={r.color} size="sm" />
              </td>
              <td className="py-2 pl-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate" title={r.name}>{r.name}</span>
                  <span className="flex shrink-0 items-center">
                    <Amount value={r.total} className="font-bold" />
                    <span className="ml-2 inline-block w-9 text-right text-xs text-slate tabular">{Math.round(r.share * 100)}%</span>
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-soft">
                  <div className="h-full rounded-r-xs" style={{ width: `${(r.total / max) * 100}%`, background: r.color }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
