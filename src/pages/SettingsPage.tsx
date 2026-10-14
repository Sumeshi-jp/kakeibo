import { LogOut, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuth, useUid } from '../auth/useAuth'
import { BottomSheet } from '../components/BottomSheet'
import { CategoryIcon } from '../components/CategoryIcon'
import { Segmented } from '../components/fields'
import { ManagedList } from '../components/ManagedList'
import { PillButton } from '../components/PillButton'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { useCategories } from '../data/hooks'
import { moved, reorderItems } from '../data/mutations'
import { CategoryForm } from '../forms/CategoryForm'
import type { Category, CategoryType } from '../types'

export default function SettingsPage() {
  const uid = useUid()
  const { user, signOutUser } = useAuth()
  const { data: categories } = useCategories()
  const [type, setType] = useState<CategoryType>('expense')
  const [editing, setEditing] = useState<{ category?: Category } | null>(null)

  const list = categories.filter((c) => c.type === type)
  const label = type === 'expense' ? '支出' : '収入'

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section>
        <SectionEyebrow
          aside={
            <button type="button" onClick={() => setEditing({})} className="flex min-h-11 items-center gap-1 px-1 text-sm font-bold text-ink">
              <Plus size={16} /> 追加
            </button>
          }
        >
          カテゴリ
        </SectionEyebrow>
        <div className="mb-3">
          <Segmented
            label="種類"
            value={type}
            onChange={setType}
            options={[
              { value: 'expense', label: '支出' },
              { value: 'income', label: '収入' },
            ]}
          />
        </div>
        <ManagedList
          items={list}
          emptyText={`${label}のカテゴリはまだありません`}
          onSelect={(category) => setEditing({ category })}
          onMove={(i, d) => {
            const ids = list.filter((c) => !c.archived).map((c) => c.id)
            reorderItems(uid, 'categories', moved(ids, i, d))
          }}
          renderItem={(c) => (
            <>
              <CategoryIcon icon={c.icon} color={c.color} size="sm" />
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
            </>
          )}
        />
      </section>

      <section>
        <SectionEyebrow>アカウント</SectionEyebrow>
        <p className="border-b border-hairline py-3 text-sm text-slate">{user?.email}</p>
        <div className="pt-4">
          <PillButton variant="outline" onClick={signOutUser}>
            <LogOut size={18} /> ログアウト
          </PillButton>
        </div>
      </section>

      <BottomSheet
        open={editing !== null}
        title={`${label}カテゴリを${editing?.category ? '編集' : '追加'}`}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <CategoryForm
            key={editing.category?.id ?? `new-${type}`}
            category={editing.category}
            type={type}
            siblings={list}
            onDone={() => setEditing(null)}
          />
        )}
      </BottomSheet>
    </div>
  )
}
