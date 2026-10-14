import { format } from 'date-fns'
import { ArrowDown, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useUid } from '../auth/useAuth'
import { CategoryIcon } from '../components/CategoryIcon'
import { Segmented, SelectField, YenInput } from '../components/fields'
import { PillButton } from '../components/PillButton'
import { TextInput } from '../components/TextInput'
import { createTransaction, deleteTransaction, updateTransaction } from '../data/mutations'
import type { Lookups } from '../data/useLookups'
import { useUiStore } from '../store/uiStore'
import type { AccountKind, MoneyRef, NewTransaction, Transaction, TransactionType } from '../types'

interface TransactionFormProps {
  tx?: Transaction
  defaultDate?: string
  lookups: Lookups
  onDone: () => void
}

const encode = (ref: MoneyRef | undefined) => (ref ? `${ref.kind}:${ref.id}` : '')
const decode = (v: string): MoneyRef | undefined => {
  const [kind, id] = v.split(':')
  return kind && id ? { kind: kind as MoneyRef['kind'], id } : undefined
}

/** 口座・カードの選択肢。allowCard=false のときは現金と銀行だけ */
function SourceOptions({ lookups, allowCard, current }: { lookups: Lookups; allowCard: boolean; current?: string }) {
  // アーカイブ済みでも、編集中の明細が使っているものは選択肢に残す
  const visible = <T extends { id: string; archived: boolean }>(xs: T[], kind: string) =>
    xs.filter((x) => !x.archived || `${kind}:${x.id}` === current)
  const group = (kind: AccountKind) => visible(lookups.accounts.filter((a) => a.kind === kind), kind)
  return (
    <>
      <option value="" disabled>
        選んでください
      </option>
      <optgroup label="現金">
        {group('cash').map((a) => (
          <option key={a.id} value={`cash:${a.id}`}>
            {a.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="銀行">
        {group('bank').map((a) => (
          <option key={a.id} value={`bank:${a.id}`}>
            {a.name}
          </option>
        ))}
      </optgroup>
      {allowCard && (
        <optgroup label="クレカ">
          {visible(lookups.cards, 'card').map((c) => (
            <option key={c.id} value={`card:${c.id}`}>
              {c.name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  )
}

/** 既定の支払い方法：前回使ったもの → 最初の現金口座 */
function initialSource(lookups: Lookups, last: MoneyRef | null, type: TransactionType): string {
  const exists = (r: MoneyRef) =>
    r.kind === 'card' ? lookups.cards.some((c) => c.id === r.id && !c.archived) : lookups.accounts.some((a) => a.id === r.id && !a.archived)
  if (last && exists(last) && !(last.kind === 'card' && type !== 'expense')) return encode(last)
  const first = lookups.accounts.find((a) => !a.archived && a.kind === 'cash') ?? lookups.accounts.find((a) => !a.archived)
  return first ? `${first.kind}:${first.id}` : ''
}

export function TransactionForm({ tx, defaultDate, lookups, onDone }: TransactionFormProps) {
  const uid = useUid()
  const lastSource = useUiStore((s) => s.lastSource)
  const setLastSource = useUiStore((s) => s.setLastSource)

  const [type, setType] = useState<TransactionType>(tx?.type ?? 'expense')
  const [amount, setAmount] = useState(tx?.amount ?? 0)
  const [date, setDate] = useState(() => tx?.date ?? defaultDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [categoryId, setCategoryId] = useState<string | null>(tx?.categoryId ?? null)
  const [sourceRaw, setSource] = useState(() => (tx ? encode(tx.source) : ''))
  // 口座の読み込みが終わる前に開かれた場合もあるので、未選択なら既定値を毎回計算する
  const source = sourceRaw || (tx ? '' : initialSource(lookups, lastSource, type))
  const [to, setTo] = useState(() => encode(tx?.to))
  const [memo, setMemo] = useState(tx?.memo ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const categories = lookups.categories.filter((c) => c.type === type && (!c.archived || c.id === tx?.categoryId))
  const sourceRef = decode(source)
  const toRef = decode(to)

  const changeType = (next: TransactionType) => {
    setType(next)
    setCategoryId(null)
    // 収入・振替ではクレカを使えないので選び直してもらう
    if (next !== 'expense' && sourceRef?.kind === 'card') setSource(initialSource(lookups, null, next))
  }

  const canSave =
    amount > 0 &&
    date !== '' &&
    !!sourceRef &&
    (type === 'transfer' ? !!toRef && to !== source : categoryId !== null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSave || !sourceRef) return
    const data: NewTransaction = {
      type,
      date,
      amount,
      categoryId: type === 'transfer' ? null : categoryId,
      source: sourceRef,
      to: type === 'transfer' && toRef && toRef.kind !== 'card' ? { kind: toRef.kind, id: toRef.id } : undefined,
      memo: memo.trim(),
      recurringId: tx?.recurringId,
    }
    if (tx) updateTransaction(uid, tx.id, data)
    else createTransaction(uid, data)
    setLastSource(sourceRef)
    onDone()
  }

  if (lookups.accounts.length === 0 && !lookups.loading) {
    return <p className="text-slate">先に「口座」画面で口座を登録してください。</p>
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Segmented
        label="種類"
        value={type}
        onChange={changeType}
        options={[
          { value: 'expense', label: '支出' },
          { value: 'income', label: '収入' },
          { value: 'transfer', label: '振替' },
        ]}
      />

      <YenInput label="金額" value={amount} onChange={setAmount} size="lg" autoFocus={!tx} />

      {type !== 'transfer' && (
        <fieldset>
          <legend className="mb-2 text-sm text-slate">カテゴリ</legend>
          <div className="grid grid-cols-4 gap-1 sm:grid-cols-5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={categoryId === c.id}
                onClick={() => setCategoryId(c.id)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border px-1 py-2 text-xs ${categoryId === c.id ? 'border-ink bg-soft font-bold' : 'border-transparent'}`}
              >
                <CategoryIcon icon={c.icon} color={c.color} size="sm" />
                <span className="w-full truncate text-center">{c.name}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <SelectField
        label={type === 'income' ? '入金先' : type === 'transfer' ? '振替元' : '支払い方法'}
        value={source}
        onChange={(e) => setSource(e.target.value)}
      >
        <SourceOptions lookups={lookups} allowCard={type === 'expense'} current={source} />
      </SelectField>

      {type === 'transfer' && (
        <>
          <ArrowDown aria-hidden size={18} className="-my-2 self-center text-slate" />
          <SelectField label="振替先" value={to} onChange={(e) => setTo(e.target.value)}>
            <SourceOptions lookups={lookups} allowCard={false} current={to} />
          </SelectField>
          {to !== '' && to === source && <p className="-mt-2 text-sm text-expense">振替元と振替先が同じです</p>}
        </>
      )}

      <TextInput label="日付" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <TextInput label="メモ" placeholder="任意" value={memo} onChange={(e) => setMemo(e.target.value)} />

      <div className="flex flex-col gap-3 border-t border-hairline pt-4">
        <PillButton type="submit" block disabled={!canSave}>
          {tx ? '保存' : '追加'}
        </PillButton>
        {tx &&
          (confirmDelete ? (
            <PillButton
              variant="danger"
              block
              onClick={() => {
                deleteTransaction(uid, tx.id)
                onDone()
              }}
            >
              <Trash2 size={18} /> 本当に削除する
            </PillButton>
          ) : (
            <PillButton variant="outline" block onClick={() => setConfirmDelete(true)}>
              <Trash2 size={18} /> 削除
            </PillButton>
          ))}
      </div>
    </form>
  )
}
