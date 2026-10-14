/**
 * 縦軸の目盛り。上下に余白をとり、1・2・2.5・5 × 10ⁿ の等間隔にそろえる。
 * 値が一定（記録を始めたばかり）でも範囲が潰れないよう、最低限の幅を持たせる。
 */
export function yTicks(values: number[]): number[] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min
  const pad = span > 0 ? span * 0.1 : Math.max(Math.abs(max) * 0.1, 10_000)
  const rough = (span + pad * 2) / 3
  const mag = 10 ** Math.floor(Math.log10(rough))
  const norm = rough / mag
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag
  const lo = Math.floor((min - pad) / step) * step
  const hi = Math.ceil((max + pad) / step) * step
  const ticks: number[] = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v))
  return ticks
}
