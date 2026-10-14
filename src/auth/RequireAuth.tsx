import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center text-slate" role="status">
        読み込み中…
      </div>
    )
  }
  return user ? <Outlet /> : <Navigate to="/login" replace />
}
