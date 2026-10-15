import { format } from 'date-fns'
import { ArrowDown, Camera, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useUid } from '../auth/useAuth'
import { CategoryIcon } from '../components/CategoryIcon'
import { Segmented, SelectField, YenInput } from '../components/fields'
import { PillButton } from '../components/PillButton'
import { TextInput } from '../components/TextInput'
import { useRecurring } from '../data/hooks'
import { createItem, createTransaction, deleteTransaction, nextOrder, updateTransaction } from '../data/mutations'
import { frequencyLabel } from '../lib/recurring'
import type { Lookups } from '../data/useLookups'
import { SourceOptions } from '../components/SourceOptions'
import { decodeSource as decode, encodeSource as encode } from '../lib/sourceRef'
import { clearDraft, loadDraft, saveDraft } from '../lib/entryDraft'
import type { ReceiptGuess } from '../lib/receipt'
import { useUiStore } from '../store/uiStore'
import { QuickCategoryAdd } from './QuickCategoryAdd'
import type { MoneyRef, NewTransaction, RecurringFrequency, Transaction, TransactionType } from '../types'

interface TransactionFormProps {
  tx?: Transaction
  defaultDate?: string
  lookups: Lookups
  onDone: () => void
}


/** レシートを撮影・選択して、合計金額と日付を読み取る */
function ReceiptButton({ onRead }: { onRead: (guess: ReceiptGuess) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setStatus('準備中…')
    try {
      const { readReceipt } = await import('../lib/ocr')
      const guess = await readReceipt(file, (r) => setStatus(`読み取り中… ${Math.round(r * 100)}%`))
      onRead(guess)
      setStatus(
        guess.amount || guess.date
          ? `読み取りました（${[guess.amount && '金額', guess.date && '日付'].filter(Boolean).join('・')}）。違っていたら直してください`
          : '読み取れませんでした。手で入力してください',
      )
    } catch (e) {
      console.error(e)
      setStatus('読み取りに失敗しました。通信状態を確認してください')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const busy = status?.startsWith('準備') || status?.startsWith('読み取り中')
  return (
    <div className="-mt-2">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="flex min-h-11 items-center gap-2 text-sm text-ink disabled:opacity-50"
      >
        <Camera size={18} /> レシートを読み取る
      </button>
      {status && (
        <p role="status" className="text-xs text-slate">
          {status}
        </p>
      )}
    </div>
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

  // 新規入力では、前回閉じたときの入力途中の内容（下書き）があれば続きから始める
  const [draft, setDraft] = useState(() => (tx ? null : loadDraft()))
  const [type, setType] = useState<TransactionType>(tx?.type ?? draft?.type ?? 'expense')
  const [amount, setAmount] = useState(tx?.amount ?? draft?.amount ?? 0)
  const [date, setDate] = useState(() => tx?.date ?? defaultDate ?? draft?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [categoryId, setCategoryId] = useState<string | null>(tx?.categoryId ?? draft?.categoryId ?? null)
  const [sourceRaw, setSource] = useState(() => (tx ? encode(tx.source) : (draft?.source ?? '')))
  // 口座の読み込みが終わる前に開かれた場合もあるので、未選択なら既定値を毎回計算する
  const source = sourceRaw || (tx ? '' : initialSource(lookups, lastSource, type))
  const [to, setTo] = useState(() => (tx ? encode(tx.to) : (draft?.to ?? '')))
  const [memo, setMemo] = useState(tx?.memo ?? draft?.memo ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  // 新規入力のときだけ、同じ内容を定期収支として登録できる
  const [repeat, setRepeat] = useState<'none' | RecurringFrequency>(draft?.repeat ?? 'none')
  const { data: rules } = useRecurring()

  // 新規入力の内容は、変わるたびに端末へ一時保存する（シートを閉じたり、アプリを閉じたりしても消えない）
  useEffect(() => {
    if (tx) return
    saveDraft({ type, amount, date, categoryId, source: sourceRaw, to, memo, repeat })
  }, [tx, type, amount, date, categoryId, sourceRaw, to, memo, repeat])

  /** 下書きを捨てて、まっさらな状態に戻す */
  const discardDraft = () => {
    clearDraft()
    setDraft(null)
    setType('expense')
    setAmount(0)
    setDate(defaultDate ?? format(new Date(), 'yyyy-MM-dd'))
    setCategoryId(null)
    setSource('')
    setTo('')
    setMemo('')
    setRepeat('none')
  }

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
    else if (repeat !== 'none' && type !== 'transfer' && categoryId) {
      // 定期収支のルールを作り、今回の明細はその1回目として登録する（作成済みの日付を今回の日付にして二重登録を防ぐ）
      const ruleId = createItem(uid, 'recurring', {
        type,
        amount,
        categoryId,
        source: sourceRef,
        memo: memo.trim(),
        frequency: repeat,
        day: Number(date.slice(8)),
        month: repeat === 'yearly' ? Number(date.slice(5, 7)) : null,
        startDate: date,
        endDate: null,
        lastGeneratedDate: date,
        order: nextOrder(rules),
        archived: false,
      })
      createTransaction(uid, { ...data, recurringId: ruleId })
    } else createTransaction(uid, data)
    if (!tx) clearDraft()
    setLastSource(sourceRef)
    onDone()
  }

  if (lookups.accounts.length === 0 && !lookups.loading) {
    return <p className="text-slate">先に「口座」画面で口座を登録してください。</p>
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {draft && (
        <div role="status" className="-mb-1 flex items-center justify-between gap-3 rounded-md bg-soft px-3 py-2 text-sm">
          <span className="text-charcoal">前回の入力途中の内容を復元しました</span>
          <button type="button" onClick={discardDraft} className="hit-44 shrink-0 text-sm font-bold text-ink underline">
            破棄
          </button>
        </div>
      )}
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

      {!tx && (
        <ReceiptButton
          onRead={(guess) => {
            if (guess.amount) setAmount(guess.amount)
            if (guess.date) setDate(guess.date)
          }}
        />
      )}

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
            <QuickCategoryAdd
              type={type === 'income' ? 'income' : 'expense'}
              siblings={lookups.categories.filter((c) => c.type === type)}
              onAdded={setCategoryId}
            />
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

      {!tx && type !== 'transfer' && (
        <div>
          <Segmented
            label="くり返し"
            value={repeat}
            onChange={setRepeat}
            options={[
              { value: 'none', label: 'なし' },
              { value: 'monthly', label: '毎月' },
              { value: 'yearly', label: '毎年' },
            ]}
          />
          {repeat !== 'none' && (
            <p className="mt-1 text-xs text-slate">
              {frequencyLabel({ frequency: repeat, day: Number(date.slice(8)) || 1, month: Number(date.slice(5, 7)) || 1 })}
              に同じ内容を自動で登録します（設定の「定期収支」で変更・停止できます）
            </p>
          )}
        </div>
      )}
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
