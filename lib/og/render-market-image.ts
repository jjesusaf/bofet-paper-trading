import sharp from 'sharp'
import { readFile } from 'fs/promises'
import { join } from 'path'
import type { MarketOGData } from './get-market-data'

const WIDTH = 1200
const HEIGHT = 630
const BRAND_GREEN = '#2f8b57'
const BG_DARK = '#0f1923'

function getYesProbability(data: MarketOGData): {
  label: string
  pct: number
} | null {
  try {
    const prices: string[] = JSON.parse(data.outcomePrices)
    const outcomes: string[] = JSON.parse(data.outcomes)
    const yesIdx = outcomes.findIndex(
      (o) => o.toLowerCase() === 'yes' || o.toLowerCase() === 'sí'
    )
    if (yesIdx === -1 || !prices[yesIdx]) return null
    const pct = Math.round(parseFloat(prices[yesIdx]) * 100)
    const label = outcomes[yesIdx]
    return { label, pct }
  } catch {
    return null
  }
}

// Cache logo buffer
let logoBuf: Buffer | null = null

async function getLogoBuffer(): Promise<Buffer> {
  if (logoBuf) return logoBuf
  const logoPath = join(process.cwd(), 'public', 'bfet_green_circular.png')
  logoBuf = await readFile(logoPath)
  return logoBuf
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const arrayBuf = await res.arrayBuffer()
    return Buffer.from(arrayBuf)
  } catch {
    return null
  }
}

export async function renderMarketOGImage(
  data: MarketOGData
): Promise<Buffer> {
  const prob = getYesProbability(data)

  // Fetch market image + logo in parallel
  const [marketImgBuf, rawLogo] = await Promise.all([
    data.imageUrl ? fetchImageBuffer(data.imageUrl) : null,
    getLogoBuffer(),
  ])

  // --- Base: dark background ---
  const base = sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 15, g: 25, b: 35, alpha: 1 },
    },
  })

  const composites: sharp.OverlayOptions[] = []

  // 1. Gradient background
  const bgSvg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${BG_DARK}" stop-opacity="1"/>
        <stop offset="1" stop-color="#0a2a1a" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  </svg>`
  composites.push({ input: Buffer.from(bgSvg), top: 0, left: 0 })

  // 2. Market image — full container, fully visible (no crop)
  if (marketImgBuf) {
    const marketImg = await sharp(marketImgBuf)
      .resize(WIDTH, HEIGHT, {
        fit: 'contain',
        background: { r: 15, g: 25, b: 35, alpha: 1 },
      })
      .jpeg()
      .toBuffer()

    composites.push({ input: marketImg, top: 0, left: 0 })
  }

  // 3. Dark gradient at bottom for overlays readability
  const gradientSvg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.65" stop-color="black" stop-opacity="0"/>
        <stop offset="1" stop-color="black" stop-opacity="0.75"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
  </svg>`
  composites.push({ input: Buffer.from(gradientSvg), top: 0, left: 0 })

  // 4. Logo pill (top-left)
  const logoResized = await sharp(rawLogo).resize(44, 44).png().toBuffer()
  const logoPillSvg = `<svg width="155" height="56" xmlns="http://www.w3.org/2000/svg">
    <rect width="155" height="56" rx="28" fill="white" fill-opacity="0.95"/>
    <text x="60" y="36" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="${BRAND_GREEN}">Bofet</text>
  </svg>`
  composites.push({ input: Buffer.from(logoPillSvg), top: 28, left: 28 })
  composites.push({ input: logoResized, top: 34, left: 34 })

  // 5. Probability badge (bottom-left)
  if (prob) {
    const probColor = prob.pct >= 50 ? BRAND_GREEN : '#dc2626'
    const probText = `${prob.pct}%`
    const labelText = prob.label
    const pillWidth = probText.length * 36 + labelText.length * 16 + 60

    const probSvg = `<svg width="${pillWidth}" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="${pillWidth}" height="64" rx="16" fill="white" fill-opacity="0.95"/>
      <text x="20" y="44" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="bold" fill="${probColor}">${probText}</text>
      <text x="${probText.length * 36 + 28}" y="42" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600" fill="#6b7280">${labelText}</text>
    </svg>`
    composites.push({
      input: Buffer.from(probSvg),
      top: HEIGHT - 28 - 64,
      left: 28,
    })
  }

  // 6. URL (bottom-right)
  const urlSvg = `<svg width="240" height="30" xmlns="http://www.w3.org/2000/svg">
    <text x="240" y="22" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="600" fill="rgba(255,255,255,0.7)">app.usebofet.com</text>
  </svg>`
  composites.push({
    input: Buffer.from(urlSvg),
    top: HEIGHT - 48,
    left: WIDTH - 268,
  })

  // 7. Accent line (top)
  const accentSvg = `<svg width="${WIDTH}" height="4" xmlns="http://www.w3.org/2000/svg">
    <rect width="${WIDTH}" height="4" fill="${BRAND_GREEN}"/>
  </svg>`
  composites.push({ input: Buffer.from(accentSvg), top: 0, left: 0 })

  // Compose and output as JPEG
  const result = await base
    .composite(composites)
    .jpeg({ quality: 85 })
    .toBuffer()

  return result
}
