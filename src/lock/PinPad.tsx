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
  // 素早く連打しても桁が抜けないよう、最新の入力と判定中かどうかは ref で持つ
  const pinRef = useRef('')
  const busyRef = useRef(false)
  const setPin = (v: string) => {
    pinRef.current = v
    setPinState(v)
  }

  const press = async (key: string) => {
    if (disabled || busyRef.current) return
    if (key === 'del') return setPin(pinRef.current.slice(0, -1))
    if (pinRef.current.length >= length) return
    const next = pinRef.current + key
    setPin(next)
    if (next.length === length) {
      busyRef.current = true
      const ok = await onComplete(next)
      busyRef.current = false
      if (!ok) {
        setShake(true)
        setTimeout(() => setShake(false), 400)
      }
      setPin('')
    }
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
    <div className="flex flex-col items-center gap-7 select-none">
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
              onClick={() => press(k)}
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
