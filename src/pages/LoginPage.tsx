import { FirebaseError } from 'firebase/app'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Brand } from '../components/Brand'
import { PillButton } from '../components/PillButton'

function errorMessage(e: unknown) {
  if (e instanceof FirebaseError) {
    if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') return null
    if (e.code === 'auth/popup-blocked') return 'ポップアップがブロックされました。ブラウザの設定で許可してください。'
    if (e.code === 'auth/unauthorized-domain') return 'このURLはログインが許可されていません（Firebase の承認済みドメインを確認してください）。'
    if (e.code === 'auth/network-request-failed') return 'ネットワークにつながっていません。'
  }
  return 'ログインに失敗しました。もう一度お試しください。'
}

export default function LoginPage() {
  const { user, loading, signIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && user) return <Navigate to="/" replace />

  const handleSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-3">
        <Brand size="lg" as="h1" />
      </div>
      <p className="mb-10 flex items-center gap-3 pb-6 font-serif tracking-[0.12em] text-slate">
        <span aria-hidden className="h-px w-6 bg-marker" />
        自分のための家計簿
      </p>
      <PillButton block onClick={handleSignIn} disabled={busy || loading}>
        <svg aria-hidden viewBox="0 0 24 24" className="size-5">
          <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.7 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.68 3.7 14.55 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12s4.15 9.25 9.25 9.25c5.34 0 8.88-3.75 8.88-9.04 0-.6-.07-1.06-.15-1.11z" />
        </svg>
        {busy ? 'ログイン中…' : 'Google でログイン'}
      </PillButton>
      {error && (
        <p role="alert" className="mt-4 text-sm text-expense">
          {error}
        </p>
      )}
    </main>
  )
}
