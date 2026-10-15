/**
 * ロック解除の状態を、同じ起動中（タブ・アプリを閉じるまで）だけ覚えておく。
 * sessionStorage はページを読み込み直しても残り、アプリを閉じると消えるので、
 * 「解除した直後の読み込み直しで、もう一度 PIN を求められる」のを防げる。
 */
const UNLOCKED_KEY = 'kakeibo-unlocked'
const HIDDEN_AT_KEY = 'kakeibo-hidden-at'

const safe = <T>(fn: () => T, fallback: T): T => {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export const markUnlocked = () => safe(() => sessionStorage.setItem(UNLOCKED_KEY, '1'), undefined)
export const clearUnlocked = () => safe(() => sessionStorage.removeItem(UNLOCKED_KEY), undefined)
export const markHidden = (at: number) => safe(() => sessionStorage.setItem(HIDDEN_AT_KEY, String(at)), undefined)
export const clearHidden = () => safe(() => sessionStorage.removeItem(HIDDEN_AT_KEY), undefined)

/** 最後にバックグラウンドへ回った時刻（なければ 0） */
export const hiddenAt = () => safe(() => Number(sessionStorage.getItem(HIDDEN_AT_KEY) ?? 0), 0)

/** この起動中に解除済みで、ロックするほど長くバックグラウンドにいなかったか */
export function stillUnlocked(lockAfterSec: number, now = Date.now()): boolean {
  if (!safe(() => sessionStorage.getItem(UNLOCKED_KEY) === '1', false)) return false
  const at = hiddenAt()
  return !at || now - at < lockAfterSec * 1000
}
