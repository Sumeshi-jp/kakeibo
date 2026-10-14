import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact } from '../../lib/money'
import { useUiStore } from '../../store/uiStore'
import { ChartTooltip } from './ChartTooltip'

export interface AssetPoint {
  asOf: string // 'YYYY-MM-DD'
  net: number
}

const LINE = 'var(--color-ink)'

/** 総資産の推移（1系列なので凡例なし。見出しが系列名を兼ねる） */
export function AssetLineChart({ data }: { data: AssetPoint[] }) {
  const hidden = useUiStore((s) => s.hideAmounts)
  if (data.length < 2) {
    return <p className="border-b border-hairline py-6 text-center text-sm text-slate">推移を表示するには2か月分以上の記録が必要です</p>
  }
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-hairline)" />
          <XAxis
            dataKey="asOf"
            tickFormatter={(d: string) => `${Number(d.slice(5, 7))}月`}
            tick={{ fontSize: 11, fill: 'var(--color-slate)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-silver)' }}
            interval="preserveStartEnd"
          />
          <YAxis
            width={44}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => formatCompact(v, hidden)}
            tick={{ fontSize: 11, fill: 'var(--color-slate)' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ stroke: 'var(--color-silver)', strokeWidth: 1 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <ChartTooltip
                  title={String(payload[0].payload.asOf).replace(/^(\d+)-0?(\d+)-0?(\d+)$/, '$1年$2月$3日')}
                  rows={[{ label: '総資産', value: Number(payload[0].payload.net), color: LINE }]}
                />
              ) : null
            }
          />
          <Line
            type="linear"
            dataKey="net"
            stroke={LINE}
            strokeWidth={2}
            dot={{ r: 4, fill: LINE, stroke: 'var(--color-canvas)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: LINE, stroke: 'var(--color-canvas)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
