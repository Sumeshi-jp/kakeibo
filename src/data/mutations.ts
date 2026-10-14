import { deleteDoc, deleteField, doc, serverTimestamp, setDoc, updateDoc, writeBatch, type DocumentData } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useUiStore } from '../store/uiStore'
import type { NewTransaction } from '../types'
import { DEMO, demoStore } from './demo'
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
  if (DEMO) {
    const id = demoStore.newId()
    demoStore.set(name, id, data)
    return id
  }
  const ref = doc(userCol(uid, name))
  track(setDoc(ref, data))
  return ref.id
}

export function updateItem(uid: string, name: CollectionName, id: string, data: DocumentData) {
  if (DEMO) return demoStore.update(name, id, data)
  track(updateDoc(userDoc(uid, name, id), data))
}

/** 並べ替え後の id の並びを受け取り、order を 0 から振り直す */
export function reorderItems(uid: string, name: CollectionName, orderedIds: string[]) {
  if (DEMO) return orderedIds.forEach((id, i) => demoStore.update(name, id, { order: i }))
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

export function createTransaction(uid: string, tx: NewTransaction) {
  if (DEMO) return demoStore.set('transactions', demoStore.newId(), stripUndefined(tx))
  const ref = doc(userCol(uid, 'transactions'))
  track(setDoc(ref, { ...stripUndefined(tx), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
}

export function updateTransaction(uid: string, id: string, tx: NewTransaction) {
  if (DEMO) return demoStore.set('transactions', id, stripUndefined(tx))
  // to や recurringId を消す場合もあるので、merge せずに丸ごと置き換える（createdAt は残す）
  track(
    setDoc(
      userDoc(uid, 'transactions', id),
      { ...stripUndefined(tx), to: tx.to ?? deleteField(), updatedAt: serverTimestamp() },
      { merge: true },
    ),
  )
}

export function deleteTransaction(uid: string, id: string) {
  if (DEMO) return demoStore.remove('transactions', id)
  track(deleteDoc(userDoc(uid, 'transactions', id)))
}

/** Firestore は undefined を保存できないため取り除く */
function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T
}
