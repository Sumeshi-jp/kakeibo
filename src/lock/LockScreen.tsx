import { useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { Brand } from '../components/Brand'
import { useLockStore } from './lockStore'
import { checkPin, clearPin, getPinConfig, lockoutRemainingMs, recordFailure, resetFailures } from './pin'
import { PinPad } from './PinPad'

/** PIN を入れるまでアプリの中身を表示しない */
export function LockScreen() {
  const unlock = useLockStore((s) => s.unlock)
  const { signOutUser } = useAuth()
  const length = getPinConfig()?.length ?? 4
  const [message, setMessage] = useState<string | null>(null)
  const [waitMs, setWaitMs] = useState(() => lockoutRemainingMs())
  const [confirmForgot, setConfirmForgot] = useState(false)

  // 入力停止中は残り秒数を数える
  useEffect(() => {
    if (waitMs <= 0) return
    const t = setInterval(() => setWaitMs(lockoutRemainingMs()), 500)
    return () => clearInterval(t)
  }, [waitMs])

  const submit = async (pin: string) => {
    if (await checkPin(pin)) {
      resetFailures()
      unlock()
      return true
    }
    const { failed, until } = recordFailure()
    const rest = until - Date.now()
    if (rest > 0) setWaitMs(rest)
    setMessage(`PIN が違います（${failed}回目）`)
    return false
  }

  return (
    <main className="pt-safe flex min-h-dvh flex-col items-center justify-center gap-8 bg-canvas px-6">
      <Brand size="lg" as="h1" />
      <p className="text-sm text-slate" role="alert">
        {waitMs > 0 ? `${Math.ceil(waitMs / 1000)}秒後にもう一度入力できます` : (message ?? 'PIN を入力してください')}
      </p>
      <PinPad length={length} onComplete={submit} disabled={waitMs > 0} />
      {confirmForgot ? (
        <div className="flex max-w-xs flex-col items-center gap-3 text-center text-sm">
          <p className="text-charcoal">ログアウトして PIN を削除します。もう一度 Google でログインすると使えます。</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={async () => {
                clearPin()
                await signOutUser()
                unlock()
              }}
              className="min-h-11 rounded-lg bg-ink px-5 text-white"
            >
              ログアウトする
            </button>
            <button type="button" onClick={() => setConfirmForgot(false)} className="min-h-11 rounded-lg border border-ink px-5">
              やめる
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmForgot(true)} className="min-h-11 text-sm text-slate underline">
          PIN を忘れた場合
        </button>
      )}
    </main>
  )
}
