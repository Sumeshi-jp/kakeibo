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

import { yTicks } from '../src/lib/chartScale'

describe('yTicks（資産推移の目盛り）', () => {
  it('等間隔のきりのよい値になる', () => {
    const t = yTicks([706_000, 1_240_000, 1_195_000])
    const steps = t.slice(1).map((v, i) => v - t[i])
    expect(new Set(steps).size).toBe(1)
    expect(t[0]).toBeLessThanOrEqual(706_000)
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(1_240_000)
  })
  it('値が一定でも範囲が潰れない', () => {
    const t = yTicks([500_000, 500_000, 500_000])
    expect(t.length).toBeGreaterThanOrEqual(3)
    expect(t[0]).toBeLessThan(500_000)
    expect(t[t.length - 1]).toBeGreaterThan(500_000)
  })
  it('0 円でも潰れない', () => {
    expect(yTicks([0, 0]).length).toBeGreaterThanOrEqual(3)
  })
})
