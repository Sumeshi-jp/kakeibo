import { Navigate, Outlet } from 'react-router-dom'
import { LockScreen } from '../lock/LockScreen'
import { useLockStore } from '../lock/lockStore'
import { useAutoLock } from '../lock/useAutoLock'
import { useAuth } from './useAuth'

export function RequireAuth() {
  const { user, loading } = useAuth()
  const locked = useLockStore((s) => s.locked)
  useAutoLock()
  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center text-slate" role="status">
        読み込み中…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  // PIN を入れるまでは中身を描画しない（データの読み込みも始めない）
  return locked ? <LockScreen /> : <Outlet />
}
