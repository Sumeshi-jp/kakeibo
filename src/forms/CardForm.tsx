import { useState, type FormEvent } from 'react'
import { useUid } from '../auth/useAuth'
import { SelectField } from '../components/fields'
import { TextInput } from '../components/TextInput'
import { createItem, nextOrder, updateItem } from '../data/mutations'
import { DAY_OPTIONS, dayLabel, monthOffsetLabel } from '../lib/days'
import type { Account, Card } from '../types'
import { FormActions } from './FormActions'

interface CardFormProps {
  card?: Card
  bankAccounts: Account[]
  siblings: Card[]
  onDone: () => void
}

export function CardForm({ card, bankAccounts, siblings, onDone }: CardFormProps) {
  const uid = useUid()
  const [name, setName] = useState(card?.name ?? '')
  const [closingDay, setClosingDay] = useState(card?.closingDay ?? 15)
  const [withdrawalMonthOffset, setOffset] = useState(card?.withdrawalMonthOffset ?? 1)
  const [withdrawalDay, setWithdrawalDay] = useState(card?.withdrawalDay ?? 10)
  const [withdrawalAccountId, setAccountId] = useState(card?.withdrawalAccountId ?? bankAccounts[0]?.id ?? '')

  const canSave = name.trim() !== '' && withdrawalAccountId !== ''

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    const data = { name: name.trim(), closingDay, withdrawalDay, withdrawalMonthOffset, withdrawalAccountId }
    if (card) updateItem(uid, 'cards', card.id, data)
    else createItem(uid, 'cards', { ...data, order: nextOrder(siblings), archived: false })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <TextInput label="名前" placeholder="例：楽天カード" value={name} onChange={(e) => setName(e.target.value)} autoFocus={!card} />
      <SelectField label="締め日" value={closingDay} onChange={(e) => setClosingDay(Number(e.target.value))}>
        {DAY_OPTIONS.map((d) => (
          <option key={d} value={d}>
            {dayLabel(d)}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="引き落とし月" value={withdrawalMonthOffset} onChange={(e) => setOffset(Number(e.target.value))}>
          {[1, 2].map((n) => (
            <option key={n} value={n}>
              {monthOffsetLabel(n)}
            </option>
          ))}
        </SelectField>
        <SelectField label="引き落とし日" value={withdrawalDay} onChange={(e) => setWithdrawalDay(Number(e.target.value))}>
          {DAY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {dayLabel(d)}
            </option>
          ))}
        </SelectField>
      </div>
      {bankAccounts.length > 0 ? (
        <SelectField label="引き落とし口座" value={withdrawalAccountId} onChange={(e) => setAccountId(e.target.value)}>
          {bankAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </SelectField>
      ) : (
        <p className="rounded-sm bg-soft p-3 text-sm text-charcoal">先に銀行口座を登録してください。引き落とし口座として選べるようになります。</p>
      )}
      <p className="text-sm text-slate">
        毎月{dayLabel(closingDay)}締め・{monthOffsetLabel(withdrawalMonthOffset)}
        {dayLabel(withdrawalDay)}引き落とし
      </p>
      <FormActions
        canSave={canSave}
        archived={card?.archived}
        onToggleArchive={
          card
            ? () => {
                updateItem(uid, 'cards', card.id, { archived: !card.archived })
                onDone()
              }
            : undefined
        }
      />
    </form>
  )
}
