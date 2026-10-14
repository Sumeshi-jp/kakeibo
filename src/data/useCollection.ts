import { onSnapshot, type Query } from 'firebase/firestore'
import { useEffect, useState } from 'react'

export interface CollectionState<T> {
  data: T[]
  loading: boolean
  error: Error | null
}

/**
 * Firestore のクエリを購読し、変更があれば自動で更新する。
 * query は依存キー（key）が変わったときだけ作り直す。
 */
export function useCollection<T extends { id: string }>(makeQuery: () => Query, key: string): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({ data: [], loading: true, error: null })

  useEffect(() => {
    setState((s) => ({ ...s, loading: true }))
    return onSnapshot(
      makeQuery(),
      (snap) => setState({ data: snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T), loading: false, error: null }),
      (error) => setState({ data: [], loading: false, error }),
    )
    // makeQuery はレンダーごとに作り直されるため、key で再購読を制御する
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return state
}
