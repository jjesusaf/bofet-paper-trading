import { Metadata } from 'next'
import MarketPageContent from './MarketPageContent'
import { getMarketOGData } from '@/lib/og/get-market-data'
import config from '@/config'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${config.domainName}`

// Generate dynamic metadata for each market
export async function generateMetadata({
  params,
}: {
  params: Promise<{ marketSlug: string; lang: string }>
}): Promise<Metadata> {
  const { marketSlug, lang } = await params

  try {
    const data = await getMarketOGData(marketSlug, lang)

    if (!data) {
      throw new Error('Market not found')
    }

    const title = `${data.question} | Bofet`
    const description = data.description
      ? data.description.slice(0, 200)
      : data.question

    const ogImageUrl = `${baseUrl}/${lang}/market/${marketSlug}/opengraph-image`

    return {
      metadataBase: new URL(baseUrl),
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        siteName: 'Bofet',
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            type: 'image/jpeg',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    }
  } catch (error) {
    console.error('[generateMetadata] Error:', error)

    const fallbackTitle =
      lang === 'en'
        ? 'Bofet - Prediction Market'
        : 'Bofet - Mercado de Predicción'

    return {
      metadataBase: new URL(baseUrl),
      title: fallbackTitle,
      openGraph: {
        title: fallbackTitle,
        type: 'article',
        siteName: 'Bofet',
      },
      twitter: {
        card: 'summary_large_image',
        title: fallbackTitle,
      },
    }
  }
}

export default async function MarketPage({
  params,
}: {
  params: Promise<{ marketSlug: string; lang: string }>
}) {
  const { marketSlug } = await params

  return <MarketPageContent marketSlug={marketSlug} />
}
