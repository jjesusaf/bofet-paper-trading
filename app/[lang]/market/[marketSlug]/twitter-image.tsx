import { getMarketOGData } from '@/lib/og/get-market-data'
import { renderMarketOGImage } from '@/lib/og/render-market-image'

export const runtime = 'nodejs'
export const revalidate = 60
export const size = { width: 1200, height: 630 }
export const contentType = 'image/jpeg'

export default async function Image({
  params,
}: {
  params: Promise<{ lang: string; marketSlug: string }>
}) {
  const { lang, marketSlug } = await params
  const data = await getMarketOGData(marketSlug, lang)

  const buf = await renderMarketOGImage(
    data ?? {
      question: 'Bofet - Mercado de Predicción',
      description: '',
      outcomePrices: '[]',
      outcomes: '[]',
      slug: marketSlug,
      imageUrl: '',
    }
  )

  return new Response(new Uint8Array(buf), {
    headers: { 'Content-Type': 'image/jpeg' },
  })
}
