import type { Lookups } from '../data/useLookups'
import type { AccountKind } from '../types'

/** 口座・カードの選択肢。allowCard=false のときは現金と銀行だけ */
export function SourceOptions({ lookups, allowCard, current }: { lookups: Lookups; allowCard: boolean; current?: string }) {
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

