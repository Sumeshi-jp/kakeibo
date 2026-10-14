import { Banknote, CreditCard, Landmark, Plus } from 'lucide-react'
import { useState } from 'react'
import { useUid } from '../auth/useAuth'
import { Amount } from '../components/Amount'
import { BottomSheet } from '../components/BottomSheet'
import { ManagedList } from '../components/ManagedList'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { useAccounts, useCards } from '../data/hooks'
import { moved, reorderItems } from '../data/mutations'
import { AccountForm } from '../forms/AccountForm'
import { CardForm } from '../forms/CardForm'
import { dayLabel, monthOffsetLabel } from '../lib/days'
import type { Account, AccountKind, Card } from '../types'

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
  const { data: accounts } = useAccounts()
  const { data: cards } = useCards()
  const [editing, setEditing] = useState<Editing>(null)

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
              {/* Phase 6 で取引を反映した現在の残高に置き換える */}
              <span className="text-right text-xs text-slate">
                初期残高
                <br />
                <Amount value={a.initialBalance} className="text-sm text-ink" />
              </span>
            </>
          )}
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
      </BottomSheet>
    </div>
  )
}
