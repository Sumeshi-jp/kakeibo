import { describe, expect, it } from 'vitest'
import { parseReceipt } from '../src/lib/receipt'

describe('parseReceipt', () => {
  it('合計の行から金額を、日付の行から日付を取り出す', () => {
    const text = `
      スーパーマルフジ
      2026年10月14日(水) 18:32
      牛乳            ¥238
      食パン          ¥158
      小 計          ¥396
      (内消費税等     ¥29)
      合 計          ¥396
      お預り          ¥1,000
      お釣り          ¥604
    `
    expect(parseReceipt(text)).toEqual({ amount: 396, date: '2026-10-14' })
  })

  it('全角数字やスラッシュ区切りの日付にも対応する', () => {
    const text = '２０２６／０９／０３\nお会計　￥１，２８０\nお預かり ￥２，０００'
    expect(parseReceipt(text)).toEqual({ amount: 1280, date: '2026-09-03' })
  })

  it('令和表記と2桁年', () => {
    expect(parseReceipt('令和8年1月5日\n合計 500').date).toBe('2026-01-05')
    expect(parseReceipt('26/02/28 12:00\n合計 500').date).toBe('2026-02-28')
  })

  it('合計が読めないときは ¥ 付きの最大の金額（お預かりなどは除く）', () => {
    const text = '商品A ¥300\n商品B ¥1,200\nお預り ¥5,000'
    expect(parseReceipt(text).amount).toBe(1200)
  })

  it('読み取れなければ null', () => {
    expect(parseReceipt('ありがとうございました')).toEqual({ amount: null, date: null })
  })
})
