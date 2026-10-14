import { useMemo, useSyncExternalStore } from 'react'
import { demoStore } from './demo'
import type { CollectionName } from './paths'
import type { CollectionState } from './useCollection'

/** デモモード用。メモリ上のデータを useCollection と同じ形で返す */
export function useDemoCollection<T extends { id: string }>(name: CollectionName, select: (xs: T[]) => T[]): CollectionState<T> {
  const version = useSyncExternalStore(demoStore.subscribe, demoStore.version)
  // select は毎回作り直されるが、データが変わったときだけ計算し直せば十分
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => select(demoStore.all<T>(name)), [name, version])
  return { data, loading: false, error: null }
}
