import { Lock, X } from 'lucide-react'
import { useState } from 'react'
import { Segmented, SelectField } from '../components/fields'
import { PillButton } from '../components/PillButton'
import { SectionEyebrow } from '../components/SectionEyebrow'
import { useUiStore } from '../store/uiStore'
import { checkPin, clearPin, getPinConfig, setLockAfter, setPin } from './pin'
import { PinPad } from './PinPad'

const LOCK_AFTER = [
  { value: 0, label: 'すぐ' },
  { value: 60, label: '1分後' },
  { value: 300, label: '5分後' },
]

type Step =
  | { kind: 'verify'; then: 'change' | 'remove' }
  | { kind: 'new'; length: 4 | 6 }
  | { kind: 'confirm'; length: 4 | 6; first: string }

/** 設定画面の「アプリのロック」 */
export function PinSettings() {
  const showToast = useUiStore((s) => s.showToast)
  const [config, setConfig] = useState(getPinConfig)
  const [step, setStep] = useState<Step | null>(null)
  const [length, setLength] = useState<'4' | '6'>('4')
  const [message, setMessage] = useState<string | null>(null)

  const close = () => {
    setStep(null)
    setMessage(null)
  }

  const title =
    step?.kind === 'verify' ? '今の PIN を入力' : step?.kind === 'confirm' ? 'もう一度入力' : '新しい PIN を入力'

  const onComplete = async (pin: string) => {
    if (!step) return false
    if (step.kind === 'verify') {
      if (!(await checkPin(pin))) {
        setMessage('PIN が違います')
        return false
      }
      if (step.then === 'remove') {
        clearPin()
        setConfig(null)
        showToast('ロックを解除しました')
        close()
      } else {
        setMessage(null)
        setStep({ kind: 'new', length: config?.length ?? 4 })
      }
      return true
    }
    if (step.kind === 'new') {
      setMessage(null)
      setStep({ kind: 'confirm', length: step.length, first: pin })
      return true
    }
    if (pin !== step.first) {
      setMessage('一致しません。最初から入力してください')
      setStep({ kind: 'new', length: step.length })
      return false
    }
    await setPin(pin, config?.lockAfterSec ?? 60)
    setConfig(getPinConfig())
    showToast('PIN を設定しました')
    close()
    return true
  }

  return (
    <section>
      <SectionEyebrow>アプリのロック</SectionEyebrow>
      <p className="border-b border-hairline pb-3 text-sm text-slate">
        {config ? `${config.length}桁の PIN でロック中です。` : 'アプリを開くときに PIN を入力するようにできます。'}
        この端末だけの設定です。
      </p>
      {config ? (
        <div className="flex flex-col gap-4 pt-4">
          <SelectField
            label="バックグラウンドから戻ったときにロックする"
            value={config.lockAfterSec}
            onChange={(e) => {
              setLockAfter(Number(e.target.value))
              setConfig(getPinConfig())
            }}
          >
            {LOCK_AFTER.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
          <div className="flex flex-wrap gap-3">
            <PillButton variant="outline" onClick={() => setStep({ kind: 'verify', then: 'change' })}>
              PIN を変更
            </PillButton>
            <PillButton variant="outline" onClick={() => setStep({ kind: 'verify', then: 'remove' })}>
              ロックをやめる
            </PillButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pt-4">
          <Segmented
            label="桁数"
            value={length}
            onChange={setLength}
            options={[
              { value: '4', label: '4桁' },
              { value: '6', label: '6桁' },
            ]}
          />
          <div>
            <PillButton onClick={() => setStep({ kind: 'new', length: Number(length) as 4 | 6 })}>
              <Lock size={18} /> PIN を設定
            </PillButton>
          </div>
        </div>
      )}

      {/* シートだと iPhone で下にはみ出したため、ロック画面と同じく全画面で表示する */}
      {step && (
        <div role="dialog" aria-modal="true" aria-label={title} className="pt-safe pb-safe fixed inset-0 z-50 flex flex-col bg-canvas">
          <div className="flex shrink-0 items-center justify-between border-b border-hairline px-4 py-3">
            <h2 className="text-lg font-bold">{title}</h2>
            <button type="button" onClick={close} aria-label="閉じる" className="grid size-11 place-items-center rounded-full hover:bg-soft">
              <X size={22} />
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-4 py-6">
            <p className={`min-h-5 text-center text-sm ${message ? 'text-expense' : 'text-slate'}`} role="alert">
              {message ?? (step.kind === 'confirm' ? '確認のため、同じ PIN をもう一度入力してください' : `${step.kind === 'verify' ? (config?.length ?? 4) : step.length}桁の数字を入力してください`)}
            </p>
            <PinPad
              key={`${step.kind}-${step.kind === 'verify' ? step.then : step.length}`}
              length={step.kind === 'verify' ? (config?.length ?? 4) : step.length}
              onComplete={onComplete}
            />
          </div>
        </div>
      )}
    </section>
  )
}
