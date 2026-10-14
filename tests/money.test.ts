import { describe, expect, it } from 'vitest'
import { formatYen, parseYenInput } from '../src/lib/money'

describe('parseYenInput', () => {
  it('数字だけを読み取る（カンマ・空白・記号は無視）', () => {
    expect(parseYenInput('1,280')).toBe(1280)
    expect(parseYenInput(' ¥ 3 000円')).toBe(3000)
    expect(parseYenInput('')).toBe(0)
  })
  it('全角数字も読める', () => {
    expect(parseYenInput('１２８０')).toBe(1280)
  })
  it('先頭の 0 を取り除き、10 桁で打ち切る', () => {
    expect(parseYenInput('00120')).toBe(120)
    expect(parseYenInput('123456789012')).toBe(1234567890)
  })
  it('マイナスは allowNegative のときだけ', () => {
    expect(parseYenInput('-500', true)).toBe(-500)
    expect(parseYenInput('−500', true)).toBe(-500)
    expect(parseYenInput('-500')).toBe(500)
  })
})

describe('formatYen', () => {
  it('符号の付け方', () => {
    expect(formatYen(-1280)).toBe('−¥1,280')
    expect(formatYen(1280, { sign: 'always' })).toBe('+¥1,280')
    expect(formatYen(0, { sign: 'always' })).toBe('¥0')
    expect(formatYen(5, { hidden: true })).toBe('¥•••••')
  })
})
