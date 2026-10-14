import { CreditCard } from 'lucide-react'
import type { ReactNode } from 'react'
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

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-hairline py-3">
      <span className="text-sm text-slate">{label}</span>
      <span className="text-xl font-bold">{children}</span>
    </div>
  )
}

export default function HomePage() {
  const month = useUiStore((s) => s.month)
  const { data: txs, loading } = useTransactions(month)
  const lookups = useLookups()
  const { calc } = useAssets()
  const today = todayString()
  const sum = totals(txs)
  const assets = calc.snapshot(today)
  const upcoming = calc.upcoming(today).slice(0, 3)

  return (
    <>
      <MonthSwitcher />
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <SectionEyebrow>月の収支</SectionEyebrow>
          <Stat label="収入">
            <Amount value={sum.income} tone="income" />
          </Stat>
          <Stat label="支出">
            <Amount value={sum.expense} tone="expense" />
          </Stat>
          <Stat label="収支">
            <Amount value={sum.balance} sign="always" tone="auto" />
          </Stat>
        </section>

        <section>
          <SectionEyebrow>総資産</SectionEyebrow>
          <p className="border-b border-hairline py-3 text-4xl font-bold">
            <Amount value={assets.net} />
          </p>
          <dl className="grid grid-cols-3 gap-2 border-b border-hairline py-3 text-xs">
            <div>
              <dt className="text-slate">現金</dt>
              <dd><Amount value={assets.cash} className="text-sm" /></dd>
            </div>
            <div>
              <dt className="text-slate">銀行</dt>
              <dd><Amount value={assets.bank} className="text-sm" /></dd>
            </div>
            <div>
              <dt className="text-slate">クレカ未払い</dt>
              <dd><Amount value={-assets.cardUnpaid} className="text-sm" /></dd>
            </div>
          </dl>
          {upcoming.length > 0 && (
            <ul className="pt-2">
              {upcoming.map((s) => (
                <li key={`${s.cardId}_${s.billingMonth}`} className="flex items-center gap-2 py-1.5 text-sm">
                  <CreditCard size={16} className="text-slate" />
                  <span className="flex-1 truncate">
                    {Number(s.withdrawalDate.slice(5, 7))}/{Number(s.withdrawalDate.slice(8))} {lookups.cards.find((c) => c.id === s.cardId)?.name} 引き落とし
                  </span>
                  <Amount value={s.amount} />
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
