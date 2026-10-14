import type { User } from 'firebase/auth'
import { createContext, useContext } from 'react'

export interface AuthState {
  user: User | null
  /** ログイン状態を確認中（初回表示時） */
  loading: boolean
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth は AuthProvider の内側で使ってください')
  return ctx
}

/** ログイン済みの画面でだけ使う。uid を必ず返す */
export function useUid() {
  const { user } = useAuth()
  if (!user) throw new Error('ログインしていません')
  return user.uid
}
