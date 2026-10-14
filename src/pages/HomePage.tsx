import { Amount } from '../components/Amount'
import { SectionEyebrow } from '../components/SectionEyebrow'

// Phase 7 で実データに置き換える。今はレイアウト確認用に 0 円を表示する
const summary = { income: 0, expense: 0, assets: 0 }

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between border-b border-hairline py-3">
      <span className="text-sm text-slate">{label}</span>
      <span className="text-xl font-bold">{children}</span>
    </div>
  )
}

export default function HomePage() {
  const balance = summary.income - summary.expense
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section>
        <SectionEyebrow>今月の収支</SectionEyebrow>
        <Stat label="収入">
          <Amount value={summary.income} tone="income" />
        </Stat>
        <Stat label="支出">
          <Amount value={summary.expense} tone="expense" />
        </Stat>
        <Stat label="収支">
          <Amount value={balance} sign="always" tone="auto" />
        </Stat>
      </section>
      <section>
        <SectionEyebrow>総資産</SectionEyebrow>
        <p className="border-b border-hairline py-3 text-4xl font-bold">
          <Amount value={summary.assets} />
        </p>
        <p className="pt-2 text-xs text-slate">銀行と現金の残高合計 − クレカの未払い額</p>
      </section>
    </div>
  )
}
