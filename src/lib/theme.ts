import { useEffect } from 'react'
import { useUiStore } from '../store/uiStore'

const LIGHT_BAR = '#faf9f7'
const DARK_BAR = '#141311'

/** 設定に合わせて <html data-theme> とブラウザのバーの色を切り替える */
export function useApplyTheme() {
  const theme = useUiStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      if (theme === 'system') root.removeAttribute('data-theme')
      else root.setAttribute('data-theme', theme)
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? DARK_BAR : LIGHT_BAR))
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
}
