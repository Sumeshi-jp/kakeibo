import { useState, type FormEvent } from 'react'
import { useUid } from '../auth/useAuth'
import { Segmented, SelectField, YenInput } from '../components/fields'
import { SourceOptions } from '../components/SourceOptions'
import { TextInput } from '../components/TextInput'
import { createItem, nextOrder, updateItem } from '../data/mutations'
import type { Lookups } from '../data/useLookups'
import { todayString } from '../lib/dates'
import { DAY_OPTIONS, dayLabel } from '../lib/days'
import { frequencyLabel } from '../lib/recurring'
import { decodeSource, encodeSource } from '../lib/sourceRef'
import type { RecurringFrequency, RecurringRule } from '../types'
import { FormActions } from './FormActions'

interface RecurringFormProps {
  rule?: RecurringRule
  lookups: Lookups
  siblings: RecurringRule[]
  onDone: () => void
}

export function RecurringForm({ rule, lookups, siblings, onDone }: RecurringFormProps) {
  const uid = useUid()
  const [type, setType] = useState<'expense' | 'income'>(rule?.type ?? 'expense')
  const [amount, setAmount] = useState(rule?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(rule?.categoryId ?? '')
  const [source, setSource] = useState(encodeSource(rule?.source))
  const [frequency, setFrequency] = useState<RecurringFrequency>(rule?.frequency ?? 'monthly')
  const [month, setMonth] = useState(rule?.month ?? 1)
  const [day, setDay] = useState(rule?.day ?? 27)
  const [startDate, setStartDate] = useState(() => rule?.startDate ?? todayString())
  const [endDate, setEndDate] = useState(rule?.endDate ?? '')
  const [memo, setMemo] = useState(rule?.memo ?? '')

  const categories = lookups.categories.filter((c) => c.type === type && (!c.archived || c.id === rule?.categoryId))
  const sourceRef = decodeSource(source)
  const canSave =
    amount > 0 &&
    categories.some((c) => c.id === categoryId) &&
    !!sourceRef &&
    !(type === 'income' && sourceRef.kind === 'card') &&
    startDate !== '' &&
    (endDate === '' || endDate >= startDate)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSave || !sourceRef) return
    const data: Record<string, unknown> = {
      type,
      amount,
      categoryId,
      source: sourceRef,
      memo: memo.trim(),
      frequency,
      day,
      month: frequency === 'yearly' ? month : null,
      startDate,
      endDate: endDate || null,
    }
    if (rule) updateItem(uid, 'recurring', rule.id, data)
    else createItem(uid, 'recurring', { ...data, order: nextOrder(siblings), archived: false })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Segmented
        label="種類"
        value={type}
        onChange={(t) => {
          setType(t)
          setCategoryId('')
        }}
        options={[
          { value: 'expense', label: '支出' },
          { value: 'income', label: '収入' },
        ]}
      />
      <YenInput label="金額" value={amount} onChange={setAmount} autoFocus={!rule} />
      <TextInput label="メモ（明細に表示）" placeholder="例：家賃、Netflix" value={memo} onChange={(e) => setMemo(e.target.value)} />
      <SelectField label="カテゴリ" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
        <option value="" disabled>
          選んでください
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </SelectField>
      <SelectField label={type === 'income' ? '入金先' : '支払い方法'} value={source} onChange={(e) => setSource(e.target.value)}>
        <SourceOptions lookups={lookups} allowCard={type === 'expense'} current={source} />
      </SelectField>
      <Segmented
        label="くり返し"
        value={frequency}
        onChange={setFrequency}
        options={[
          { value: 'monthly', label: '毎月' },
          { value: 'yearly', label: '毎年' },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        {frequency === 'yearly' && (
          <SelectField label="月" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </SelectField>
        )}
        <SelectField label="日" value={day} onChange={(e) => setDay(Number(e.target.value))}>
          {DAY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {dayLabel(d)}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextInput label="開始日" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <TextInput label="終了日（任意）" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      <p className="text-xs text-slate">
        {frequencyLabel({ frequency, day, month })}に自動で明細を登録します。開始日が過去の場合は、今日までの分もまとめて登録されます。
      </p>
      <FormActions
        canSave={canSave}
        archived={rule?.archived}
        onToggleArchive={
          rule
            ? () => {
                // 再開したときに停止中の分をさかのぼって登録しないよう、作成済みの日付を今日にする
                updateItem(uid, 'recurring', rule.id, rule.archived ? { archived: false, lastGeneratedDate: todayString() } : { archived: true })
                onDone()
              }
            : undefined
        }
      />
    </form>
  )
}
