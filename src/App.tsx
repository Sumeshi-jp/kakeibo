import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { AppLayout } from './components/AppLayout'
import AccountsPage from './pages/AccountsPage'
import CalendarPage from './pages/CalendarPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ReportPage from './pages/ReportPage'
import SettingsPage from './pages/SettingsPage'

// GitHub Pages はURLの書き換えができないため HashRouter（#/calendar 形式）を使う
export default function App() {
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
