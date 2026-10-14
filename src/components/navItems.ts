import { CalendarDays, ChartPie, House, Landmark, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const primaryNav: NavItem[] = [
  { to: '/', label: 'ホーム', icon: House },
  { to: '/calendar', label: 'カレンダー', icon: CalendarDays },
  { to: '/report', label: 'レポート', icon: ChartPie },
  { to: '/accounts', label: '口座', icon: Landmark },
]

export const settingsNav: NavItem = { to: '/settings', label: '設定', icon: Settings }
