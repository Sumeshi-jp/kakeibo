import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact } from '../../lib/money'
import { useHidden } from '../../store/uiStore'
import { EyeToggle } from '../EyeToggle'
import { ChartTooltip } from './ChartTooltip'
import { HIDE_BALANCE } from '../../lib/hideKeys'

export interface MonthlyPoint {
  month: string // 'YYYY-MM'
  income: number
  expense: number
}

const INCOME = 'var(--color-income-mark)'
const EXPENSE = 'var(--color-expense-mark)'

/** 月別の収入と支出（並べた棒）。凡例は上に置く */
export function MonthlyBarChart({ data }: { data: MonthlyPoint[] }) {
  const hidden = useHidden(HIDE_BALANCE)
  return (
    <figure>
      <figcaption className="mb-2 flex items-center gap-4 text-xs text-slate">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-xs" style={{ background: INCOME }} />
          収入
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-xs" style={{ background: EXPENSE }} />
          支出
        </span>
        <EyeToggle hideKey={HIDE_BALANCE} className="ml-auto" />
      </figcaption>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2} barCategoryGap="22%" margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-hairline)" strokeDasharray="0" />
            <XAxis
              dataKey="month"
              tickFormatter={(m: string) => `${Number(m.slice(5))}月`}
              tick={{ fontSize: 10, fill: 'var(--color-slate)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-silver)' }}
              interval={0}
            />
            <YAxis
              width={44}
              tickFormatter={(v: number) => formatCompact(v, hidden)}
              tick={{ fontSize: 11, fill: 'var(--color-slate)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-soft)' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <ChartTooltip
                    hidden={hidden}
                    title={`${String(label).slice(0, 4)}年${Number(String(label).slice(5))}月`}
                    rows={[
                      { label: '収入', value: Number(payload[0]?.payload.income ?? 0), color: INCOME },
                      { label: '支出', value: Number(payload[0]?.payload.expense ?? 0), color: EXPENSE },
                    ]}
                  />
                ) : null
              }
            />
            <Bar dataKey="income" name="収入" fill={INCOME} radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="expense" name="支出" fill={EXPENSE} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
