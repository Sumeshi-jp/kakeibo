import { ArrowRightLeft, CreditCard } from 'lucide-react'
import type { Lookups } from '../data/useLookups'
import { dayHeading } from '../lib/dates'
import { signedAmount } from '../lib/summary'
import { useUiStore } from '../store/uiStore'
import type { Transaction } from '../types'
import { Amount } from './Amount'
import { CategoryIcon } from './CategoryIcon'


function Row({ tx, lookups }: { tx: Transaction; lookups: Lookups }) {
  const editEntry = useUiStore((s) => s.editEntry)
  const cat = lookups.category(tx.categoryId)
  const title = tx.type === 'transfer' ? '振替' : (cat?.name ?? '未分類')
  const sub =
    tx.type === 'transfer'
      ? `${lookups.sourceName(tx.source)} → ${lookups.sourceName(tx.to)}`
      : lookups.sourceName(tx.source)

  return (
    <li className="border-b border-hairline">
      <button type="button" onClick={() => editEntry(tx)} className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
        {tx.type === 'transfer' ? (
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-soft text-slate">
            <ArrowRightLeft size={18} />
          </span>
        ) : (
          <CategoryIcon icon={cat?.icon ?? 'ellipsis'} color={cat?.color ?? '#595959'} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate">
            {title}
            {tx.memo && <span className="ml-2 text-sm text-slate">{tx.memo}</span>}
          </span>
          <span className="flex items-center gap-1 truncate text-xs text-slate">
            {tx.source.kind === 'card' && <CreditCard size={12} aria-label="クレカ" />}
            {sub}
          </span>
        </span>
        <Amount
          value={tx.type === 'transfer' ? tx.amount : signedAmount(tx)}
          sign={tx.type === 'transfer' ? 'none' : 'always'}
          tone={tx.type === 'transfer' ? 'plain' : 'auto'}
          className="shrink-0 font-bold"
        />
      </button>
    </li>
  )
}

interface TransactionListProps {
  transactions: Transaction[]
  lookups: Lookups
  emptyText?: string
  /** 日付ごとの見出しを出すか（1日分だけ表示するときは不要） */
  groupByDay?: boolean
}

export function TransactionList({ transactions, lookups, emptyText = '明細はまだありません', groupByDay = true }: TransactionListProps) {
  if (transactions.length === 0) return <p className="border-b border-hairline py-6 text-center text-sm text-slate">{emptyText}</p>

  if (!groupByDay) {
    return (
      <ul>
        {transactions.map((tx) => (
          <Row key={tx.id} tx={tx} lookups={lookups} />
        ))}
      </ul>
    )
  }

  const days = new Map<string, Transaction[]>()
  for (const tx of transactions) days.set(tx.date, [...(days.get(tx.date) ?? []), tx])

  return (
    <div className="flex flex-col gap-4">
      {[...days].map(([date, txs]) => (
        <section key={date}>
          <div className="flex items-baseline justify-between border-b border-ink pb-1 text-sm">
            <h3 className="font-bold">{dayHeading(date)}</h3>
            <Amount value={txs.reduce((s, t) => s + signedAmount(t), 0)} sign="always" tone="auto" className="text-xs" />
          </div>
          <ul>
            {txs.map((tx) => (
              <Row key={tx.id} tx={tx} lookups={lookups} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
