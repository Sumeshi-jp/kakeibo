/**
 * PWA 用アイコンを作る。
 * assets/icon-source.png があればそれを使い、なければ仮のアイコン（グレー地に K）を描く。
 * 使い方: npm run icons
 */
import { existsSync, mkdirSync } from 'node:fs'
import sharp from 'sharp'

const SOURCE = 'assets/icon-source.png'
const OUT = 'public/icons'
mkdirSync(OUT, { recursive: true })

const placeholderSvg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2f2f2"/>
      <stop offset="1" stop-color="#d4d4d4"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <text x="256" y="372" text-anchor="middle" font-family="Didot, 'Bodoni 72', serif" font-size="330" fill="#111">K</text>
</svg>`

/** 正方形に切り抜いた元画像（size×size） */
async function base(size) {
  if (existsSync(SOURCE)) {
    // iOS のホーム画面アイコンは透過できないので、透明部分は白で埋める
    return sharp(SOURCE).flatten({ background: '#ffffff' }).resize(size, size, { fit: 'cover', position: 'centre' }).png().toBuffer()
  }
  return sharp(Buffer.from(placeholderSvg(size))).png().toBuffer()
}

/**
 * maskable 用：端末によって丸や角丸に切り抜かれるので、内側 80% に収める。
 * 元画像を使う場合は、元画像の余白が十分（文字が中央 60% 程度に収まっている）なのでそのまま使う。
 */
async function maskable(size) {
  if (existsSync(SOURCE)) return base(size)
  const inner = Math.round(size * 0.8)
  const img = await base(inner)
  const { data } = await sharp(img).resize(1, 1).raw().toBuffer({ resolveWithObject: true })
  const background = { r: data[0], g: data[1], b: data[2], alpha: 1 }
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: img, gravity: 'centre' }])
    .png()
    .toBuffer()
}

const targets = [
  ['pwa-192x192.png', () => base(192)],
  ['pwa-512x512.png', () => base(512)],
  ['maskable-512x512.png', () => maskable(512)],
  ['apple-touch-icon-180x180.png', () => base(180)],
  ['favicon-64x64.png', () => base(64)],
]

for (const [name, make] of targets) {
  await sharp(await make()).toFile(`${OUT}/${name}`)
  console.log(`${OUT}/${name}`)
}
console.log(existsSync(SOURCE) ? `元画像: ${SOURCE}` : '元画像がないため仮アイコンを作りました')
