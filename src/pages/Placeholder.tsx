import { SectionEyebrow } from '../components/SectionEyebrow'

/** まだ実装していない画面の仮表示 */
export function Placeholder({ section, phase }: { section: string; phase: string }) {
  return (
    <section>
      <SectionEyebrow>{section}</SectionEyebrow>
      <p className="border-t border-hairline pt-4 text-slate">{phase} で実装します。</p>
    </section>
  )
}
