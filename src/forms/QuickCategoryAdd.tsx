import { Check, Plus } from 'lucide-react'
import { useState } from 'react'
import { useUid } from '../auth/useAuth'
import { createItem, nextOrder } from '../data/mutations'
import { CATEGORY_COLORS } from '../lib/categoryIcons'
import type { Category, CategoryType } from '../types'

interface QuickCategoryAddProps {
  type: CategoryType
  siblings: Category[]
  /** 追加したカテゴリの id を受け取り、選択状態にする */
  onAdded: (id: string) => void
}

/** 収支入力の途中でカテゴリを追加する（アイコンなどの細かい設定は設定画面で） */
export function QuickCategoryAdd({ type, siblings, onAdded }: QuickCategoryAddProps) {
  const uid = useUid()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  // まだ使われていない色を初期値にする
  const [color, setColor] = useState(() => CATEGORY_COLORS.find((c) => !siblings.some((s) => s.color === c)) ?? CATEGORY_COLORS[0])

  const add = () => {
    if (!name.trim()) return
    const id = createItem(uid, 'categories', {
      name: name.trim(),
      type,
      icon: 'ellipsis',
      color,
      budget: null,
      order: nextOrder(siblings),
      archived: false,
    })
    onAdded(id)
    setName('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-silver px-1 py-2 text-xs text-slate"
      >
        <Plus size={18} />
        追加
      </button>
    )
  }

  return (
    <div className="col-span-full flex flex-col gap-3 rounded-md bg-soft p-3">
      <label className="block">
        <span className="mb-1 block text-sm text-slate">新しいカテゴリの名前</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          // 外側の収支フォームが送信されないよう、Enter はここで止める
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          className="h-11 w-full rounded-xl border border-slate bg-canvas px-4 text-base outline-none focus:border-ink focus:ring-1 focus:ring-ink"
        />
      </label>
      <div className="grid grid-cols-6 gap-2" role="group" aria-label="色">
        {CATEGORY_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`色 ${c}`}
            aria-pressed={color === c}
            onClick={() => setColor(c)}
            className="grid aspect-square min-h-9 place-items-center rounded-full text-white"
            style={{ background: c }}
          >
            {color === c && <Check size={16} strokeWidth={3} />}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={add} disabled={!name.trim()} className="min-h-10 flex-1 rounded-lg bg-ink text-sm text-white disabled:opacity-40">
          追加して選ぶ
        </button>
        <button type="button" onClick={() => setOpen(false)} className="min-h-10 flex-1 rounded-lg border border-ink text-sm">
          やめる
        </button>
      </div>
      <p className="text-xs text-slate">アイコンや予算は、あとで設定画面から変更できます。</p>
    </div>
  )
}
