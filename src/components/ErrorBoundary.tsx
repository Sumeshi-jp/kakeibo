import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/** 表示中にエラーが起きても画面を真っ白にせず、内容と再読み込みボタンを出す */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(error)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div role="alert" className="mx-auto flex max-w-md flex-col gap-4 px-6 py-16">
        <p className="text-lg font-bold">画面の表示中にエラーが起きました</p>
        <p className="text-sm text-slate">再読み込みすると直ることがあります。何度も起きる場合は、下の内容を教えてください。</p>
        <pre className="overflow-x-auto rounded-sm bg-soft p-3 text-xs whitespace-pre-wrap text-charcoal">{error.message}</pre>
        <button type="button" onClick={() => location.reload()} className="min-h-11 rounded-lg bg-ink px-5 text-white">
          再読み込み
        </button>
      </div>
    )
  }
}
