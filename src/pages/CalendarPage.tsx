import { addDays, endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from 'date-fns'
import { CreditCard, Plus } from 'lucide-react'
import { useState } from 'react'
import { Amount } from '../components/Amount'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { PillButton } from '../components/PillButton'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { TransactionList } from '../components/TransactionList'
import { useTransactions } from '../data/hooks'
import { useAssets } from '../data/useAssets'
import { useLookups } from '../data/useLookups'
import { dayHeading, todayString } from '../lib/dates'
import { formatCompact } from '../lib/money'
import { totalsByDay } from '../lib/summary'
import { useHidden, useUiStore } from '../store/uiStore'
import { EyeToggle } from '../components/EyeToggle'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const CALENDAR_KEY = 'calendar'

export default function CalendarPage() {
  const month = useUiStore((s) => s.month)
  const hidden = useHidden(CALENDAR_KEY)
  const openEntry = useUiStore((s) => s.openEntry)
  const { data: txs } = useTransactions(month)
  const lookups = useLookups()
  const { calc } = useAssets()
  const today = todayString()
  const [picked, setPicked] = useState<string | null>(null)
  // 表示中の月に含まれない日が選ばれていたら、今日（今月なら）か1日を選ぶ
  const selected = picked?.startsWith(month) ? picked : today.startsWith(month) ? today : `${month}-01`

  const byDay = totalsByDay(txs)
  const withdrawals = calc.statements.filter((s) => s.withdrawalDate.startsWith(month) && s.amount !== 0)

  const first = parseISO(`${month}-01`)
  const days: Date[] = []
  for (let d = startOfWeek(startOfMonth(first)); d <= endOfWeek(endOfMonth(first)); d = addDays(d, 1)) days.push(d)

  const dayTxs = txs.filter((t) => t.date === selected)
  const dayWithdrawals = withdrawals.filter((s) => s.withdrawalDate === selected)

  return (
    <>
      <MonthSwitcher />
      <div className="grid gap-8 md:grid-cols-[3fr_2fr]">
        <div>
          <div className="mb-1 flex items-center justify-end gap-1 text-xs text-slate">
            カレンダーの金額
            <EyeToggle hideKey={CALENDAR_KEY} />
          </div>
          <div className="grid grid-cols-7 border-b border-ink text-center text-xs text-slate">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`py-1 ${i === 0 ? 'text-expense' : ''}`}>
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const key = format(d, 'yyyy-MM-dd')
              const inMonth = key.startsWith(month)
              const t = byDay.get(key)
              const hasWithdrawal = withdrawals.some((s) => s.withdrawalDate === key)
              const isSelected = key === selected
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!inMonth}
                  onClick={() => setPicked(key)}
                  aria-pressed={isSelected}
                  aria-label={dayHeading(key)}
                  className={`flex min-h-16 flex-col items-stretch border-b border-hairline px-0.5 pt-1 pb-1.5 text-left disabled:opacity-0 ${isSelected ? 'bg-soft' : ''}`}
                >
                  <span className="flex items-center justify-center gap-0.5">
                    <span
                      className={`grid size-6 place-items-center rounded-full text-xs tabular ${key === today ? 'bg-ink font-bold text-white' : ''} ${isSelected && key !== today ? 'ring-1 ring-ink' : ''}`}
                    >
                      {d.getDate()}
                    </span>
                  </span>
                  <span className="mt-0.5 flex flex-col items-center text-[10px] leading-tight tabular">
                    {t?.income ? <span className="text-income">{formatCompact(t.income, hidden)}</span> : null}
                    {t?.expense ? <span className="text-expense">{formatCompact(t.expense, hidden)}</span> : null}
                    {hasWithdrawal && <CreditCard aria-label="引き落とし" size={11} className="mt-0.5 text-slate" />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <section>
          <SectionEyebrow>{dayHeading(selected)}</SectionEyebrow>
          {dayWithdrawals.length > 0 && (
            <ul className="mb-3">
              {dayWithdrawals.map((s) => (
                <li key={`${s.cardId}_${s.billingMonth}`} className="flex items-center gap-3 border-b border-hairline py-3 text-sm">
                  <CreditCard size={18} className="text-slate" />
                  <span className="flex-1">{lookups.cards.find((c) => c.id === s.cardId)?.name} 引き落とし</span>
                  <Amount value={-s.amount} hideKey={`stmt:${s.cardId}_${s.billingMonth}`} className="font-bold" />
                </li>
              ))}
            </ul>
          )}
          <TransactionList transactions={dayTxs} lookups={lookups} groupByDay={false} emptyText="この日の明細はありません" />
          <div className="pt-4">
            <PillButton variant="outline" onClick={() => openEntry(selected)}>
              <Plus size={18} /> この日に追加
            </PillButton>
          </div>
        </section>
      </div>
    </>
  )
}
