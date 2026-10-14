import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { useApplyTheme } from './lib/theme'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout'
import { lazy } from 'react'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'

// グラフ（Recharts）を使う画面などは開いたときに読み込む
const CalendarPage = lazy(() => import('./pages/CalendarPage'))
const ReportPage = lazy(() => import('./pages/ReportPage'))
const AccountsPage = lazy(() => import('./pages/AccountsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

// GitHub Pages はURLの書き換えができないため HashRouter（#/calendar 形式）を使う
export default function App() {
  useApplyTheme()
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="report" element={<ReportPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
