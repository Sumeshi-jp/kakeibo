import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { PillButton } from '../components/PillButton'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { useCategories } from '../data/hooks'

export default function SettingsPage() {
  const { user, signOutUser } = useAuth()
  const { data: categories, loading } = useCategories()

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <section>
        <SectionEyebrow aside={loading ? '読み込み中…' : `${categories.length}件`}>カテゴリ</SectionEyebrow>
        {/* Phase 4 で編集・並べ替えを実装する */}
        <ul>
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 border-b border-hairline py-3">
              <span aria-hidden className="size-3 rounded-full" style={{ background: c.color }} />
              <span className="flex-1">{c.name}</span>
              <span className={`text-xs ${c.type === 'income' ? 'text-income' : 'text-expense'}`}>
                {c.type === 'income' ? '収入' : '支出'}
              </span>
            </li>
          ))}
        </ul>
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
    </div>
  )
}
