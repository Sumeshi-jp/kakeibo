import { format } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { useUid } from '../auth/useAuth'
import { Segmented, YenInput } from '../components/fields'
import { TextInput } from '../components/TextInput'
import { createItem, nextOrder, updateItem } from '../data/mutations'
import type { Account, AccountKind } from '../types'
import { FormActions } from './FormActions'

interface AccountFormProps {
  /** 編集時は既存の口座。新規時は undefined */
  account?: Account
  defaultKind?: AccountKind
  siblings: Account[]
  onDone: () => void
}

export function AccountForm({ account, defaultKind = 'bank', siblings, onDone }: AccountFormProps) {
  const uid = useUid()
  const [name, setName] = useState(account?.name ?? '')
  const [kind, setKind] = useState<AccountKind>(account?.kind ?? defaultKind)
  const [initialBalance, setInitialBalance] = useState(account?.initialBalance ?? 0)
  const [initialDate, setInitialDate] = useState(() => account?.initialDate ?? format(new Date(), 'yyyy-MM-dd'))

  const canSave = name.trim() !== '' && initialDate !== ''

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    const data = { name: name.trim(), kind, initialBalance, initialDate }
    if (account) updateItem(uid, 'accounts', account.id, data)
    else createItem(uid, 'accounts', { ...data, order: nextOrder(siblings), archived: false })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Segmented
        label="種類"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'bank', label: '銀行' },
          { value: 'cash', label: '現金' },
        ]}
      />
      <TextInput
        label="名前"
        placeholder={kind === 'bank' ? '例：三井住友 普通' : '例：財布'}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus={!account}
      />
      <YenInput label="初期残高" value={initialBalance} onChange={setInitialBalance} allowNegative />
      <TextInput label="残高の基準日" type="date" value={initialDate} onChange={(e) => setInitialDate(e.target.value)} />
      <p className="-mt-2 text-xs text-slate">基準日時点の残高を入れてください。それ以降の収支から今の残高を計算します。</p>
      <FormActions
        canSave={canSave}
        archived={account?.archived}
        onToggleArchive={
          account
            ? () => {
                updateItem(uid, 'accounts', account.id, { archived: !account.archived })
                onDone()
              }
            : undefined
        }
      />
    </form>
  )
}
