import { Check } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useUid } from '../auth/useAuth'
import { CategoryIcon } from '../components/CategoryIcon'
import { YenInput } from '../components/fields'
import { TextInput } from '../components/TextInput'
import { createItem, nextOrder, updateItem } from '../data/mutations'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/categoryIcons'
import type { Category, CategoryType } from '../types'
import { FormActions } from './FormActions'

interface CategoryFormProps {
  category?: Category
  type: CategoryType
  siblings: Category[]
  onDone: () => void
}

export function CategoryForm({ category, type, siblings, onDone }: CategoryFormProps) {
  const uid = useUid()
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? 'ellipsis')
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLORS[0])
  const [budget, setBudget] = useState(category?.budget ?? 0)

  const canSave = name.trim() !== ''

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSave) return
    const data = { name: name.trim(), icon, color, budget: type === 'expense' && budget > 0 ? budget : null }
    if (category) updateItem(uid, 'categories', category.id, data)
    else createItem(uid, 'categories', { ...data, type, order: nextOrder(siblings), archived: false })
    onDone()
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-end gap-3">
        <CategoryIcon icon={icon} color={color} />
        <div className="flex-1">
          <TextInput label="名前" value={name} onChange={(e) => setName(e.target.value)} autoFocus={!category} />
        </div>
      </div>

      {type === 'expense' && (
        <div>
          <YenInput label="月の予算（任意）" value={budget} onChange={setBudget} />
          <p className="mt-1 text-xs text-slate">設定すると、レポート画面で使った割合を確認できます。</p>
        </div>
      )}

      <fieldset>
        <legend className="mb-2 text-sm text-slate">色</legend>
        <div className="grid grid-cols-6 gap-2">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`色 ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className="grid aspect-square min-h-11 place-items-center rounded-full text-white"
              style={{ background: c }}
            >
              {color === c && <Check size={20} strokeWidth={3} />}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-slate">アイコン</legend>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              aria-label={key}
              aria-pressed={icon === key}
              onClick={() => setIcon(key)}
              className={`grid aspect-square min-h-11 place-items-center rounded-md border ${icon === key ? 'border-ink bg-ink text-white' : 'border-hairline text-charcoal'}`}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </fieldset>

      <FormActions
        canSave={canSave}
        archived={category?.archived}
        onToggleArchive={
          category
            ? () => {
                updateItem(uid, 'categories', category.id, { archived: !category.archived })
                onDone()
              }
            : undefined
        }
      />
    </form>
  )
}
