import { Eye, EyeOff, Settings } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { BottomSheet } from './BottomSheet'
import { SideNav } from './SideNav'
import { TabBar } from './TabBar'
import { primaryNav, settingsNav } from './navItems'

function usePageTitle() {
  const { pathname } = useLocation()
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
  const entryOpen = useUiStore((s) => s.entryOpen)
  const closeEntry = useUiStore((s) => s.closeEntry)

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
          <Outlet />
        </main>
      </div>
      <TabBar />
      <BottomSheet open={entryOpen} title="収支を入力" onClose={closeEntry}>
        {/* Phase 5 で TransactionForm に置き換える */}
        <p className="text-slate">入力フォームは Phase 5 で実装します。</p>
      </BottomSheet>
    </div>
  )
}
