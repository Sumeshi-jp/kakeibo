import type { MoneyRef } from '../types'

/** 支払い方法を <select> の値（'kind:id'）と相互に変換する */
export const encodeSource = (ref: MoneyRef | undefined) => (ref ? `${ref.kind}:${ref.id}` : '')
export const decodeSource = (v: string): MoneyRef | undefined => {
  const [kind, id] = v.split(':')
  return kind && id ? { kind: kind as MoneyRef['kind'], id } : undefined
}
