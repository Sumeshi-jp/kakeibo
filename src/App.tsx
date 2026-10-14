import { app } from './lib/firebase'

// Phase 2 でレイアウトとルーティングに置き換える
export default function App() {
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">kakeibo</h1>
      <p className="text-sm text-neutral-600">Firebase: {app.options.projectId}</p>
    </main>
  )
}
