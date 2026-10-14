/** 締め日・引き落とし日の表示。31 は「月末」として扱う */
export const dayLabel = (d: number) => (d >= 31 ? '月末' : `${d}日`)

export const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1)

export const monthOffsetLabel = (n: number) => (n === 0 ? '当月' : n === 1 ? '翌月' : n === 2 ? '翌々月' : `${n}か月後`)
