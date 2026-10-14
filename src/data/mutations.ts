import { doc, setDoc, updateDoc, writeBatch, type DocumentData } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useUiStore } from '../store/uiStore'
import { userCol, userDoc, type CollectionName } from './paths'

/**
 * 書き込みは await しない。オフラインのときは Promise がサーバー到達まで解決しないため、
 * 画面はすぐ閉じてローカルキャッシュの反映に任せ、失敗したときだけ通知する。
 */
function track(p: Promise<unknown>) {
  p.catch((e) => {
    console.error(e)
    useUiStore.getState().showToast('保存に失敗しました。通信状態を確認してください。', 'error')
  })
}

export function createItem(uid: string, name: CollectionName, data: DocumentData): string {
  const ref = doc(userCol(uid, name))
  track(setDoc(ref, data))
  return ref.id
}

export function updateItem(uid: string, name: CollectionName, id: string, data: DocumentData) {
  track(updateDoc(userDoc(uid, name, id), data))
}

/** 並べ替え後の id の並びを受け取り、order を 0 から振り直す */
export function reorderItems(uid: string, name: CollectionName, orderedIds: string[]) {
  const batch = writeBatch(db)
  orderedIds.forEach((id, i) => batch.update(userDoc(uid, name, id), { order: i }))
  track(batch.commit())
}

/** 一覧の i 番目を上下に動かした後の id 配列を返す */
export function moved(ids: string[], index: number, delta: -1 | 1): string[] {
  const j = index + delta
  if (j < 0 || j >= ids.length) return ids
  const next = [...ids]
  ;[next[index], next[j]] = [next[j], next[index]]
  return next
}

export const nextOrder = (items: { order: number }[]) => items.reduce((m, x) => Math.max(m, x.order + 1), 0)
