import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { useUid } from '../auth/useAuth'
import { Amount } from '../components/Amount'
import { YenInput } from '../components/fields'
import { PillButton } from '../components/PillButton'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { clearStatementOverride, setStatementOverride } from '../data/mutations'
import type { CardStatement } from '../lib/cardBilling'

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`

/** カードの請求一覧（直近）と、請求額の補正 */
export function CardStatements({ statements, today }: { statements: CardStatement[]; today: string }) {
  const uid = useUid()
  const [editing, setEditing] = useState<string | null>(null)
  const [value, setValue] = useState(0)

  // 引き落とし済みの直近3件と、これからの請求
  const past = statements.filter((s) => s.withdrawalDate <= today).slice(-3)
  const future = statements.filter((s) => s.withdrawalDate > today)
  const rows = [...past, ...future].reverse()

  if (rows.length === 0) return null

  return (
    <section className="mt-8">
      <SectionEyebrow as="h3">請求</SectionEyebrow>
      <ul>
        {rows.map((s) => {
          const key = s.billingMonth
          const overridden = s.amount !== s.computedAmount
          return (
            <li key={key} className="border-b border-hairline py-2">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm">
                  {md(s.withdrawalDate)} 引き落とし
                  <span className="block text-xs text-slate">
                    {md(s.closingDate)}締め{s.withdrawalDate > today ? '（予定）' : ''}
                    {overridden && ' ・ 補正済み'}
                  </span>
                </span>
                <Amount value={s.amount} hideKey={`stmt:${s.cardId}_${s.billingMonth}`} className="font-bold" />
                <button
                  type="button"
                  aria-label="請求額を補正"
                  onClick={() => {
                    setEditing(key)
                    setValue(s.amount)
                  }}
                  className="grid size-11 place-items-center text-slate"
                >
                  <Pencil size={16} />
                </button>
              </div>
              {editing === key && (
                <div className="mt-2 flex flex-col gap-2 rounded-sm bg-soft p-3">
                  <YenInput label="実際の請求額" value={value} onChange={setValue} />
                  <p className="text-xs text-slate">
                    明細から計算した額：<Amount value={s.computedAmount} hideKey={`stmt:${s.cardId}_${s.billingMonth}`} eye={false} />
                  </p>
                  <div className="flex gap-2">
                    <PillButton
                      onClick={() => {
                        setStatementOverride(uid, s.cardId, key, value)
                        setEditing(null)
                      }}
                    >
                      保存
                    </PillButton>
                    {overridden && (
                      <PillButton
                        variant="outline"
                        onClick={() => {
                          clearStatementOverride(uid, s.cardId, key)
                          setEditing(null)
                        }}
                      >
                        計算値に戻す
                      </PillButton>
                    )}
                    <PillButton variant="outline" onClick={() => setEditing(null)}>
                      やめる
                    </PillButton>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
