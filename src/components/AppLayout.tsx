import { Eye, EyeOff, Settings } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useLookups } from '../data/useLookups'
import { TransactionForm } from '../forms/TransactionForm'
import { useUiStore } from '../store/uiStore'
import { BottomSheet } from './BottomSheet'
import { SideNav } from './SideNav'
import { TabBar } from './TabBar'
import { Toast } from './Toast'
import { primaryNav, settingsNav } from './navItems'

function usePageTitle() {
  const { pathname } = useLocation()
  // 画面を切り替えたら先頭から表示する
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return [...primaryNav, settingsNav].find((n) => n.to === pathname)?.label ?? 'kakeibo'
}

function HideAmountsToggle() {
  const hidden = useUiStore((s) => s.hideAmounts)
  const toggle = useUiStore((s) => s.toggleHideAmounts)
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={hidden}
      aria-label={hidden ? '金額を表示する' : '金額を隠す'}
      title={hidden ? '金額を表示する' : '金額を隠す'}
      className="grid size-11 place-items-center rounded-full hover:bg-soft"
    >
      {hidden ? <EyeOff size={22} /> : <Eye size={22} />}
    </button>
  )
}

export function AppLayout() {
  const title = usePageTitle()
  const entry = useUiStore((s) => s.entry)
  const closeEntry = useUiStore((s) => s.closeEntry)
  // 口座・カテゴリをここで購読しておき、入力シートを開いたときにすぐ使えるようにする
  const lookups = useLookups()

  return (
    <div className="flex min-h-dvh">
      <SideNav />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="pt-safe sticky top-0 z-10 border-b border-ink bg-canvas">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-4">
            <h1 className="flex-1 text-xl font-bold">{title}</h1>
            <HideAmountsToggle />
            <Link
              to={settingsNav.to}
              aria-label="設定"
              className="grid size-11 place-items-center rounded-full hover:bg-soft md:hidden"
            >
              <Settings size={22} />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-28 md:pb-10">
          <Suspense fallback={<p className="py-10 text-center text-sm text-slate">読み込み中…</p>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <TabBar />
      <Toast />
      <BottomSheet open={entry !== null} title={entry?.mode === 'edit' ? '明細を編集' : '収支を入力'} onClose={closeEntry}>
        {entry && (
          <TransactionForm
            key={entry.mode === 'edit' ? entry.tx.id : `new-${entry.date ?? ''}`}
            tx={entry.mode === 'edit' ? entry.tx : undefined}
            defaultDate={entry.mode === 'new' ? entry.date : undefined}
            lookups={lookups}
            onDone={closeEntry}
          />
        )}
      </BottomSheet>
    </div>
  )
}
