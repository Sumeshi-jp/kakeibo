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
import { HIDE_BALANCE, HIDE_CARD } from '../lib/hideKeys'

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
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <section>
          <SectionEyebrow>月の収支</SectionEyebrow>
          <div className="surface-pearl rounded-xl px-5 pt-4 pb-3">
            <p className="pb-3 text-[2.75rem] leading-tight">
              <Amount value={sum.balance} hideKey={HIDE_BALANCE} sign="always" tone="auto" className="figure" />
            </p>
            <dl className="grid grid-cols-2 gap-4 border-t border-hairline pt-3">
              <div>
                <dt className="text-xs tracking-wider text-slate">収入</dt>
                <dd className="text-2xl">
                  <Amount value={sum.income} hideKey={HIDE_BALANCE} eye={false} tone="income" className="figure" />
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wider text-slate">支出</dt>
                <dd className="text-2xl">
                  <Amount value={sum.expense} hideKey={HIDE_BALANCE} eye={false} tone="expense" className="figure" />
                </dd>
              </div>
            </dl>
          </div>
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
                  <Amount value={s.amount} hideKey={HIDE_CARD} className="font-bold" />
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
