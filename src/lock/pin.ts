/**
 * アプリを開くときの PIN。端末ごとの設定として localStorage に保存する。
 * PIN そのものは保存せず、ソルト付きの PBKDF2 ハッシュだけを持つ。
 * （これは画面ののぞき見を防ぐためのロックで、データ自体の暗号化ではない）
 */

const CONFIG_KEY = 'kakeibo-pin'
const ATTEMPTS_KEY = 'kakeibo-pin-attempts'
const ITERATIONS = 150_000

export interface PinConfig {
  salt: string
  hash: string
  length: 4 | 6
  /** バックグラウンドからこの秒数以上たって戻ったらロックする（0 = すぐ） */
  lockAfterSec: number
}

const read = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 保存できない環境ではロックを使えない */
  }
}

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)))
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function derive(pin: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: ITERATIONS }, key, 256)
  return b64(bits)
}

export const getPinConfig = () => read<PinConfig>(CONFIG_KEY)

export async function setPin(pin: string, lockAfterSec: number) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  write(CONFIG_KEY, { salt: b64(salt), hash: await derive(pin, salt), length: pin.length as 4 | 6, lockAfterSec } satisfies PinConfig)
  write(ATTEMPTS_KEY, { failed: 0, until: 0 })
}

export function setLockAfter(lockAfterSec: number) {
  const cfg = getPinConfig()
  if (cfg) write(CONFIG_KEY, { ...cfg, lockAfterSec })
}

export function clearPin() {
  try {
    localStorage.removeItem(CONFIG_KEY)
    localStorage.removeItem(ATTEMPTS_KEY)
  } catch {
    /* noop */
  }
}

export async function checkPin(pin: string): Promise<boolean> {
  const cfg = getPinConfig()
  if (!cfg) return true
  return (await derive(pin, unb64(cfg.salt))) === cfg.hash
}

interface Attempts {
  failed: number
  /** この時刻（ms）まで入力できない */
  until: number
}

/** 何ミリ秒後まで入力を止めるか（0 なら入力できる） */
export function lockoutRemainingMs(now = Date.now()) {
  const a = read<Attempts>(ATTEMPTS_KEY)
  return a ? Math.max(0, a.until - now) : 0
}

/** 間違えた回数を記録する。5回ごとに 30秒 → 60秒 → 120秒… と入力を止める */
export function recordFailure(now = Date.now()) {
  const a = read<Attempts>(ATTEMPTS_KEY) ?? { failed: 0, until: 0 }
  const failed = a.failed + 1
  const until = failed % 5 === 0 ? now + 30_000 * 2 ** (failed / 5 - 1) : a.until
  write(ATTEMPTS_KEY, { failed, until })
  return { failed, until }
}

export const resetFailures = () => write(ATTEMPTS_KEY, { failed: 0, until: 0 })
