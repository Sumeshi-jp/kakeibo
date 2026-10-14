import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { primaryNav, type NavItem } from './navItems'

function Tab({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${isActive ? 'font-bold text-ink' : 'text-slate'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
          {item.label}
        </>
      )}
    </NavLink>
  )
}

/** スマホ用の下部タブバー。中央は入力ボタン */
export function TabBar() {
  const openEntry = useUiStore((s) => s.openEntry)
  const [a, b, c, d] = primaryNav
  return (
    <nav
      aria-label="メイン"
      className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-canvas/85 backdrop-blur-md md:hidden"
    >
      <div className="flex items-center">
        <Tab item={a} />
        <Tab item={b} />
        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => openEntry()}
            aria-label="収支を入力"
            className="grid size-12 place-items-center rounded-full bg-ink text-white shadow-[0_6px_16px_rgb(20_18_14/0.25)] ring-4 ring-canvas transition-transform active:scale-95"
          >
            <Plus size={26} strokeWidth={2.4} />
          </button>
        </div>
        <Tab item={c} />
        <Tab item={d} />
      </div>
    </nav>
  )
}
