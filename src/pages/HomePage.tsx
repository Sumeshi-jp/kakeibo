import { CreditCard } from 'lucide-react'
import { Amount } from '../components/Amount'
import { MonthSwitcher } from '../components/MonthSwitcher'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { TransactionList } from '../components/TransactionList'
import { useTransactions } from '../data/hooks'
import { useAssets } from '../data/useAssets'
import { useLookups } from '../data/useLookups'
import { todayString } from '../lib/dates'
import { totals } from '../lib/summary'
import { useUiStore } from '../store/uiStore'

export default function HomePage() {
  const month = useUiStore((s) => s.month)
  const { data: txs, loading } = useTransactions(month)
  const lookups = useLookups()
  const { calc } = useAssets()
  const today = todayString()
  const sum = totals(txs)
  const upcoming = calc.upcoming(today).slice(0, 3)

  return (
    <>
      <MonthSwitcher />
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <SectionEyebrow>月の収支</SectionEyebrow>
          <p className="border-b border-hairline py-3 text-4xl font-bold">
            <Amount value={sum.balance} sign="always" tone="auto" />
          </p>
          <dl className="grid grid-cols-2 gap-4 border-b border-hairline py-3">
            <div>
              <dt className="text-xs text-slate">収入</dt>
              <dd className="text-xl font-bold">
                <Amount value={sum.income} tone="income" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate">支出</dt>
              <dd className="text-xl font-bold">
                <Amount value={sum.expense} tone="expense" />
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <SectionEyebrow>引き落とし予定</SectionEyebrow>
          {upcoming.length === 0 ? (
            <p className="border-b border-hairline py-3 text-sm text-slate">予定はありません</p>
          ) : (
            <ul>
              {upcoming.map((s) => (
                <li key={`${s.cardId}_${s.billingMonth}`} className="flex items-center gap-2 border-b border-hairline py-3 text-sm">
                  <CreditCard size={16} className="text-slate" />
                  <span className="flex-1 truncate">
                    {Number(s.withdrawalDate.slice(5, 7))}/{Number(s.withdrawalDate.slice(8))} {lookups.cards.find((c) => c.id === s.cardId)?.name}
                  </span>
                  <Amount value={s.amount} className="font-bold" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="md:col-span-2">
          <SectionEyebrow aside={`${txs.length}件`}>明細</SectionEyebrow>
          {loading ? <p className="py-6 text-center text-sm text-slate">読み込み中…</p> : <TransactionList transactions={txs} lookups={lookups} emptyText="この月の明細はまだありません。＋から入力できます" />}
        </section>
      </div>
    </>
  )
}
