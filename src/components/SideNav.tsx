import { Plus } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useUiStore } from '../store/uiStore'
import { PillButton } from './PillButton'
import { primaryNav, settingsNav, type NavItem } from './navItems'

function SideLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `relative flex min-h-11 items-center gap-3 px-4 text-[15px] ${isActive ? 'font-bold text-ink' : 'text-slate hover:text-ink'}`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span aria-hidden className="absolute inset-y-2 left-0 w-1 bg-ink" />}
          <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
          {item.label}
        </>
      )}
    </NavLink>
  )
}

/** PC用の左サイドバー */
export function SideNav() {
  const openEntry = useUiStore((s) => s.openEntry)
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-hairline md:flex">
      <div className="flex items-center gap-2 px-4 py-5">
        <span aria-hidden className="h-6 w-2 bg-marker" />
        <span className="text-xl font-black tracking-tight">kakeibo</span>
      </div>
      <div className="px-4 pb-4">
        <PillButton block onClick={openEntry}>
          <Plus size={18} /> 収支を入力
        </PillButton>
      </div>
      <nav aria-label="メイン" className="flex flex-1 flex-col">
        {primaryNav.map((item) => (
          <SideLink key={item.to} item={item} />
        ))}
        <div className="mt-auto border-t border-hairline py-2">
          <SideLink item={settingsNav} />
        </div>
      </nav>
    </aside>
  )
}
