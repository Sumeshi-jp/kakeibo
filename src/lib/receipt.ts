/** OCR で読み取ったレシートの文字から、合計金額と日付を推定する */

export interface ReceiptGuess {
  amount: number | null
  date: string | null
}

/** 全角の数字・記号を半角にし、空白をまとめる */
function toHalfWidth(line: string): string {
  return line
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[，、]/g, ',')
    .replace(/[．]/g, '.')
    .replace(/[￥]/g, '¥')
    .replace(/[／]/g, '/')
    .replace(/[\s　]+/g, ' ')
    .trim()
}

/** 金額用：空白を取り除く（「合 計 ¥ 1,280」のような読み取り結果に対応） */
const compact = (line: string) => line.replace(/ /g, '')

const NUMBER = /[¥\\]?(\d{1,3}(?:[,.]\d{3})+|\d+)/g
const toInt = (s: string) => Number(s.replace(/[,.]/g, ''))
const lastNumber = (line: string) => {
  const all = [...line.matchAll(NUMBER)].map((m) => toInt(m[1]))
  return all.length ? all[all.length - 1] : null
}

/** 金額の候補にしない行（お預かり・お釣り・税額など） */
const EXCLUDE = /預|釣|税|対象|点数|ポイント|pt|No|TEL|電話/i
/** 合計を表す言葉（先にあるものほど優先） */
const TOTAL_KEYWORDS = [/合計|総合計|総額|総計/, /お会計|ご請求|お支払|支払金額|お買上/, /小計/]

function guessAmount(lines: string[]): number | null {
  for (const kw of TOTAL_KEYWORDS) {
    for (const line of lines) {
      if (!kw.test(line) || /預|釣/.test(line)) continue
      const n = lastNumber(line)
      if (n && n > 0 && n < 10_000_000) return n
    }
  }
  // 合計の行が読めなかった場合は、¥ 付きの金額のうち最大のもの
  const yen = lines
    .filter((l) => !EXCLUDE.test(l))
    .flatMap((l) => [...l.matchAll(/[¥\\](\d{1,3}(?:[,.]\d{3})+|\d+)/g)].map((m) => toInt(m[1])))
  return yen.length ? Math.max(...yen) : null
}

const pad = (n: number) => String(n).padStart(2, '0')
const valid = (y: number, m: number, d: number) => y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31

function guessDate(lines: string[]): string | null {
  const patterns: [RegExp, (m: RegExpMatchArray) => [number, number, number]][] = [
    [/(20\d{2}) ?[年/.-] ?(\d{1,2}) ?[月/.-] ?(\d{1,2})/, (m) => [+m[1], +m[2], +m[3]]],
    [/(?:令和|R) ?(\d{1,2}) ?[年/.] ?(\d{1,2}) ?[月/.] ?(\d{1,2})/, (m) => [2018 + +m[1], +m[2], +m[3]]],
    [/(?<!\d)(\d{2})[/.](\d{1,2})[/.](\d{1,2})(?!\d)/, (m) => [2000 + +m[1], +m[2], +m[3]]],
  ]
  for (const line of lines) {
    for (const [re, pick] of patterns) {
      const m = line.match(re)
      if (!m) continue
      const [y, mo, d] = pick(m)
      if (valid(y, mo, d)) return `${y}-${pad(mo)}-${pad(d)}`
    }
  }
  return null
}

export function parseReceipt(text: string): ReceiptGuess {
  const lines = text.split(/\r?\n/).map(toHalfWidth).filter(Boolean)
  // 日付は「26/02/28 12:00」のように時刻と隣り合うことがあるので、空白を残したまま探す
  return { amount: guessAmount(lines.map(compact)), date: guessDate(lines) }
}
