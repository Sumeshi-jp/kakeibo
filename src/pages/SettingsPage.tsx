import { Download, LogOut, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuth, useUid } from '../auth/useAuth'
import { BottomSheet } from '../components/BottomSheet'
import { CategoryIcon } from '../components/CategoryIcon'
import { Segmented } from '../components/fields'
import { ManagedList } from '../components/ManagedList'
import { PillButton } from '../components/PillButton'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { useAllTransactions, useCardStatementOverrides, useCategories, useRecurring } from '../data/hooks'
import { download, transactionsToCsv } from '../lib/exportData'
import { todayString } from '../lib/dates'
import { useLookups } from '../data/useLookups'
import { RecurringForm } from '../forms/RecurringForm'
import { frequencyLabel } from '../lib/recurring'
import { Amount } from '../components/Amount'
import { moved, reorderItems } from '../data/mutations'
import { CategoryForm } from '../forms/CategoryForm'
import { PinSettings } from '../lock/PinSettings'
import { useUiStore } from '../store/uiStore'
import type { Category, CategoryType, RecurringRule } from '../types'

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 items-center gap-1 px-1 text-sm font-bold text-ink">
      <Plus size={16} /> 追加
    </button>
  )
}

export default function SettingsPage() {
  const uid = useUid()
  const { user, signOutUser } = useAuth()
  const { data: categories } = useCategories()
  const [type, setType] = useState<CategoryType>('expense')
  const [editing, setEditing] = useState<{ category?: Category } | null>(null)
  const [editingRule, setEditingRule] = useState<{ rule?: RecurringRule } | null>(null)
  const { data: rules } = useRecurring()
  const lookups = useLookups()
  const theme = useUiStore((s) => s.theme)
  const setTheme = useUiStore((s) => s.setTheme)
  const { data: allTxs } = useAllTransactions()
  const { data: overrides } = useCardStatementOverrides()

  const list = categories.filter((c) => c.type === type)
  const label = type === 'expense' ? '支出' : '収入'

  return (
    <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
      <section>
        <SectionEyebrow
          aside={<AddButton onClick={() => setEditing({})} />}
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

      <div className="flex flex-col gap-10">
      <section>
        <SectionEyebrow aside={<AddButton onClick={() => setEditingRule({})} />}>定期取引</SectionEyebrow>
        <ManagedList
          items={rules}
          emptyText="家賃やサブスク、給料などを登録すると自動で明細になります"
          onSelect={(rule) => setEditingRule({ rule })}
          onMove={(i, d) => {
            const ids = rules.filter((r) => !r.archived).map((r) => r.id)
            reorderItems(uid, 'recurring', moved(ids, i, d))
          }}
          renderItem={(r) => {
            const cat = lookups.category(r.categoryId)
            return (
              <>
                <CategoryIcon icon={cat?.icon ?? 'ellipsis'} color={cat?.color ?? '#595959'} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{r.memo || cat?.name}</span>
                  <span className="block truncate text-xs text-slate">
                    {frequencyLabel(r)} ／ {lookups.sourceName(r.source)}
                  </span>
                </span>
              </>
            )
          }}
          renderAside={(r) => (
            <Amount value={r.type === 'expense' ? -r.amount : r.amount} sign="always" tone="auto" className="text-sm font-bold" />
          )}
        />
      </section>

      <section>
        <SectionEyebrow>バックアップ</SectionEyebrow>
        <p className="border-b border-hairline pb-3 text-sm text-slate">すべての明細をファイルに保存します。</p>
        <div className="flex flex-wrap gap-3 pt-4">
          <PillButton
            variant="outline"
            onClick={() => download(`kakeibo-${todayString()}.csv`, transactionsToCsv(allTxs, lookups), 'text/csv')}
          >
            <Download size={18} /> CSV（明細）
          </PillButton>
          <PillButton
            variant="outline"
            onClick={() =>
              download(
                `kakeibo-${todayString()}.json`,
                JSON.stringify(
                  {
                    exportedAt: new Date().toISOString(),
                    accounts: lookups.accounts,
                    cards: lookups.cards,
                    categories: lookups.categories,
                    recurring: rules,
                    cardStatements: overrides,
                    transactions: allTxs,
                  },
                  null,
                  2,
                ),
                'application/json',
              )
            }
          >
            <Download size={18} /> JSON（すべて）
          </PillButton>
        </div>
      </section>

      <section>
        <SectionEyebrow>画面の明るさ</SectionEyebrow>
        <Segmented
          label="表示"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'system', label: '自動' },
            { value: 'light', label: 'ライト' },
            { value: 'dark', label: 'ダーク' },
          ]}
        />
        <p className="pt-2 text-xs text-slate">「自動」は端末の設定（ダークモード）に合わせます。この端末だけの設定です。</p>
      </section>

      <PinSettings />

      <section>
        <SectionEyebrow>アカウント</SectionEyebrow>
        <p className="border-b border-hairline py-3 text-sm text-slate">{user?.email}</p>
        <div className="pt-4">
          <PillButton variant="outline" onClick={signOutUser}>
            <LogOut size={18} /> ログアウト
          </PillButton>
        </div>
      </section>
      </div>

      <BottomSheet open={editingRule !== null} title={editingRule?.rule ? '定期取引を編集' : '定期取引を追加'} onClose={() => setEditingRule(null)}>
        {editingRule && (
          <RecurringForm
            key={editingRule.rule?.id ?? 'new'}
            rule={editingRule.rule}
            lookups={lookups}
            siblings={rules}
            onDone={() => setEditingRule(null)}
          />
        )}
      </BottomSheet>

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
