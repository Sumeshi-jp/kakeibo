import { Delete } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface PinPadProps {
  length: number
  /** 桁がそろったら呼ばれる。false を返すと入力を消して揺らす */
  onComplete: (pin: string) => Promise<boolean> | boolean
  disabled?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

/** 数字キーパッドと入力済みの丸。物理キーボードの数字・Backspace にも対応 */
export function PinPad({ length, onComplete, disabled = false }: PinPadProps) {
  const [pin, setPinState] = useState('')
  const [shake, setShake] = useState(false)
  // 素早く連打しても桁が抜けないよう、最新の入力・確認中かどうか・確認中に押されたキーは ref で持つ
  const pinRef = useRef('')
  const busyRef = useRef(false)
  const queueRef = useRef<string[]>([])
  const setPin = (v: string) => {
    pinRef.current = v
    setPinState(v)
  }

  /** 4桁そろったら確認する。間違いなら、確認中に押されたキーを次の入力として続けて反映する */
  const verify = async (value: string) => {
    busyRef.current = true
    const ok = await onComplete(value)
    busyRef.current = false
    setPin('')
    if (ok) {
      queueRef.current = []
      return
    }
    setShake(true)
    setTimeout(() => setShake(false), 400)
    const queued = queueRef.current
    queueRef.current = []
    queued.forEach(apply)
  }

  /** キー1つ分を入力に反映する */
  function apply(key: string) {
    if (key === 'del') return setPin(pinRef.current.slice(0, -1))
    if (pinRef.current.length >= length) return
    const next = pinRef.current + key
    setPin(next)
    if (next.length === length) void verify(next)
  }

  const press = (key: string) => {
    if (disabled) return
    // 確認中（PIN の計算に一瞬かかる）に押されたキーは捨てずに取っておく
    if (busyRef.current) {
      queueRef.current.push(key)
      return
    }
    apply(key)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('del')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex flex-col items-center gap-7 select-none [-webkit-touch-callout:none]">
      <div className={`flex gap-4 ${shake ? 'animate-[shake_0.4s]' : ''}`} aria-label={`${pin.length}桁入力済み`} role="status">
        {Array.from({ length }, (_, i) => (
          <span key={i} className={`size-4 rounded-full border-2 border-ink ${i < pin.length ? 'bg-ink' : ''}`} />
        ))}
      </div>
      {/* iPhone のパスコード画面に近い大きさと間隔（押せる範囲がひと目でわかるよう、ボタン全体に色を塗る） */}
      <div className="grid grid-cols-3 gap-x-6 gap-y-4">
        {KEYS.map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button
              key={i}
              type="button"
              disabled={disabled}
              // 指が触れた瞬間に反応させる（指を離したときの click だと、iPhone で素早い連打が取りこぼされる）
              onPointerDown={(e) => {
                if (e.button !== 0) return
                e.preventDefault()
                press(k)
              }}
              // キーボードで Enter / Space を押したとき（detail が 0）だけ click で入力する
              onClick={(e) => {
                if (e.detail === 0) press(k)
              }}
              aria-label={k === 'del' ? '1文字消す' : k}
              className={`grid size-20 place-items-center rounded-full text-3xl font-medium tabular disabled:opacity-40 ${k === 'del' ? 'text-charcoal' : 'bg-soft text-ink active:bg-hairline'}`}
            >
              {k === 'del' ? <Delete size={28} /> : k}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
