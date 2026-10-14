import { parseReceipt, type ReceiptGuess } from './receipt'

/** 大きな写真は読み取りが遅いので、長辺 1600px のグレースケールに縮める */
async function prepare(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.filter = 'grayscale(1) contrast(1.3)'
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas
}

/**
 * レシート画像を端末内で読み取る（API 料金なし）。
 * 初回は日本語の学習データ（数MB）をダウンロードし、以降はブラウザにキャッシュされる。
 */
export async function readReceipt(file: File, onProgress: (ratio: number) => void): Promise<ReceiptGuess> {
  const [{ createWorker }, canvas] = await Promise.all([import('tesseract.js'), prepare(file)])
  const worker = await createWorker('jpn', undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress(m.progress)
    },
  })
  try {
    const { data } = await worker.recognize(canvas)
    return parseReceipt(data.text)
  } finally {
    await worker.terminate()
  }
}
