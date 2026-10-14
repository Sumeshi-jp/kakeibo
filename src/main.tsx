import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

/*
 * 更新を公開すると画面ごとのファイル名が変わる。開いたままの古い画面が古いファイルを読みに行くと
 * 失敗して真っ白になるため、そのときは一度だけ再読み込みして新しい版に切り替える。
 */
window.addEventListener('vite:preloadError', (event) => {
  const KEY = 'kakeibo-reloaded-at'
  const last = Number(sessionStorage.getItem(KEY) ?? 0)
  if (Date.now() - last < 10_000) return // 直前に再読み込みしたばかりなら繰り返さない（エラー画面に任せる）
  event.preventDefault()
  sessionStorage.setItem(KEY, String(Date.now()))
  location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
