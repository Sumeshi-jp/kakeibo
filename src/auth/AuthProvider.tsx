import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { useEffect, useState, type ReactNode } from 'react'
import { DEMO } from '../data/demo'
import { seedIfNeeded } from '../data/seed'
import { auth, googleProvider } from '../lib/firebase'
import { AuthContext, type AuthState } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO ? ({ uid: 'demo', email: 'demo@example.com' } as User) : null)
  const [loading, setLoading] = useState(!DEMO)

  useEffect(
    () =>
      DEMO
        ? undefined
        : onAuthStateChanged(auth, (u) => {
            // 画面はすぐに出し、初期データ（初回ログイン時だけ作るカテゴリと「財布」口座）の確認は裏で行う。
            // 作成されたデータはリアルタイム購読で画面に反映される
            if (u) seedIfNeeded(u.uid).catch((e) => console.error('初期データの作成に失敗しました', e))
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
