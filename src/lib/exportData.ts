import type { Lookups } from '../data/useLookups'
import type { Transaction } from '../types'

const TYPE_LABEL = { expense: '支出', income: '収入', transfer: '振替' } as const

const cell = (v: string | number) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

/** 明細を CSV にする（Excel で文字化けしないよう BOM を付ける） */
export function transactionsToCsv(txs: Transaction[], lookups: Lookups): string {
  const header = ['日付', '種類', '金額', 'カテゴリ', '支払い方法', '振替先', 'メモ']
  const rows = [...txs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      t.date,
      TYPE_LABEL[t.type],
      t.amount,
      lookups.category(t.categoryId)?.name ?? '',
      lookups.sourceName(t.source),
      t.to ? lookups.sourceName(t.to) : '',
      t.memo,
    ])
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
}

export function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
