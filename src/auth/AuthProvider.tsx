import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { useEffect, useState, type ReactNode } from 'react'
import { seedIfNeeded } from '../data/seed'
import { auth, googleProvider } from '../lib/firebase'
import { AuthContext, type AuthState } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        if (u) {
          // 初回ログイン時だけカテゴリと「財布」口座を作る。失敗してもアプリは使えるようにする
          await seedIfNeeded(u.uid).catch((e) => console.error('初期データの作成に失敗しました', e))
        }
        setUser(u)
        setLoading(false)
      }),
    [],
  )

  const value: AuthState = {
    user,
    loading,
    signIn: async () => {
      await signInWithPopup(auth, googleProvider)
    },
    signOutUser: () => signOut(auth),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
