import { Banknote, CreditCard, Landmark, Plus } from 'lucide-react'
import { useState } from 'react'
import { useUid } from '../auth/useAuth'
import { Amount } from '../components/Amount'
import { BottomSheet } from '../components/BottomSheet'
import { ManagedList } from '../components/ManagedList'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { AssetLineChart } from '../components/charts/AssetLineChart'
import { useAssets } from '../data/useAssets'
import { todayString } from '../lib/dates'
import { moved, reorderItems } from '../data/mutations'
import { AccountForm } from '../forms/AccountForm'
import { CardForm } from '../forms/CardForm'
import { CardStatements } from '../forms/CardStatements'
import { dayLabel, monthOffsetLabel } from '../lib/days'
import { shiftMonth } from '../lib/dates'
import type { Account, AccountKind, Card } from '../types'
import { HIDE_CARD, HIDE_CASH, hideBankKey } from '../lib/hideKeys'
import { useUiStore } from '../store/uiStore'

type Editing =
  | { type: 'account'; kind: AccountKind; account?: Account }
  | { type: 'card'; card?: Card }
  | null

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 items-center gap-1 px-1 text-sm font-bold text-ink">
      <Plus size={16} /> {label}
    </button>
  )
}

export default function AccountsPage() {
  const uid = useUid()
  const { accounts, cards, transactions, calc } = useAssets()
  const [editing, setEditing] = useState<Editing>(null)
  const today = todayString()
  const assets = calc.snapshot(today)
  // 記録のある最初の月（口座の基準日・取引日のうち最も古いもの）から今月まで。長すぎる場合は直近24か月
  const earliest = [...accounts.map((a) => a.initialDate), ...transactions.map((t) => t.date)].sort()[0] ?? today
  const startMonth = [earliest.slice(0, 7), shiftMonth(today.slice(0, 7), -23)].sort().at(-1)!
  const series = calc.monthly(startMonth, today)
  // 総資産は銀行・現金・クレカから計算するので、どれか1つでも隠していれば一緒に隠す
  const netHidden = useUiStore((s) => {
    const h = (key: string) => s.hiddenOverrides[key] ?? s.defaultHidden
    return accounts.some((a) => h(a.kind === 'bank' ? hideBankKey(a.id) : HIDE_CASH)) || (cards.length > 0 && h(HIDE_CARD))
  })

  const byKind = (kind: AccountKind) => accounts.filter((a) => a.kind === kind)
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? '未設定'

  const moveWithin = (list: { id: string; archived: boolean }[], name: 'accounts' | 'cards') => (i: number, d: -1 | 1) => {
    const ids = list.filter((x) => !x.archived).map((x) => x.id)
    reorderItems(uid, name, moved(ids, i, d))
  }

  const accountSection = (kind: AccountKind, title: string, Icon: typeof Landmark) => {
    const list = byKind(kind)
    return (
      <section>
        <SectionEyebrow aside={<AddButton label="追加" onClick={() => setEditing({ type: 'account', kind })} />}>{title}</SectionEyebrow>
        <ManagedList
          items={list}
          emptyText={`${title}はまだありません`}
          onSelect={(account) => setEditing({ type: 'account', kind, account })}
          onMove={moveWithin(list, 'accounts')}
          renderItem={(a) => (
            <>
              <Icon size={20} className="shrink-0 text-slate" />
              <span className="min-w-0 flex-1 truncate">{a.name}</span>
            </>
          )}
          renderAside={(a) => <Amount value={calc.accountBalance(a, today)} hideKey={a.kind === 'bank' ? hideBankKey(a.id) : HIDE_CASH} className="font-bold" />}
        />
      </section>
    )
  }

  const editingTitle =
    editing?.type === 'card'
      ? editing.card ? 'カードを編集' : 'カードを追加'
      : editing?.type === 'account'
        ? `${editing.kind === 'bank' ? '銀行口座' : '現金'}を${editing.account ? '編集' : '追加'}`
        : ''

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section className="md:col-span-2">
        <SectionEyebrow>総資産</SectionEyebrow>
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <div>
            <p className="border-b border-hairline py-3 text-4xl font-bold">
              <Amount value={assets.net} hidden={netHidden} />
            </p>
            <p className="pt-2 text-xs text-slate">銀行と現金の残高合計 − クレカの未払い額</p>
          </div>
          <AssetLineChart data={series} hidden={netHidden} />
        </div>
      </section>
      <div className="flex flex-col gap-10">
        {accountSection('bank', '銀行', Landmark)}
        {accountSection('cash', '現金', Banknote)}
      </div>
      <section>
        <SectionEyebrow aside={<AddButton label="追加" onClick={() => setEditing({ type: 'card' })} />}>クレジットカード</SectionEyebrow>
        <ManagedList
          items={cards}
          emptyText="カードはまだありません"
          onSelect={(card) => setEditing({ type: 'card', card })}
          onMove={moveWithin(cards, 'cards')}
          renderItem={(c) => (
            <>
              <CreditCard size={20} className="shrink-0 text-slate" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{c.name}</span>
                <span className="block text-xs text-slate">
                  {dayLabel(c.closingDay)}締め・{monthOffsetLabel(c.withdrawalMonthOffset)}
                  {dayLabel(c.withdrawalDay)}払い ／ {accountName(c.withdrawalAccountId)}
                </span>
              </span>
            </>
          )}
          renderAside={(c) => (
            <span className="text-right text-xs text-slate">
              未払い
              <br />
              <Amount value={-calc.cardUnpaid(c, today)} hideKey={HIDE_CARD} className="text-sm font-bold text-ink" />
            </span>
          )}
        />
      </section>

      <BottomSheet open={editing !== null} title={editingTitle} onClose={() => setEditing(null)}>
        {editing?.type === 'account' && (
          <AccountForm
            key={editing.account?.id ?? `new-${editing.kind}`}
            account={editing.account}
            defaultKind={editing.kind}
            siblings={accounts}
            onDone={() => setEditing(null)}
          />
        )}
        {editing?.type === 'card' && (
          <CardForm
            key={editing.card?.id ?? 'new'}
            card={editing.card}
            bankAccounts={byKind('bank').filter((a) => !a.archived || a.id === editing.card?.withdrawalAccountId)}
            siblings={cards}
            onDone={() => setEditing(null)}
          />
        )}
        {editing?.type === 'card' && editing.card && (
          <CardStatements statements={calc.statements.filter((st) => st.cardId === editing.card!.id)} today={today} />
        )}
      </BottomSheet>
    </div>
  )
}
