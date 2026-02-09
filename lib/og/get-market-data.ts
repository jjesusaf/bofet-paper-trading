import { GAMMA_API_URL } from '@/constants/api'
import { translateBatch } from '@/lib/translation/service'
import type { PolymarketMarketDetail } from '@/types/search'

import dashboardData from '@/app/api/polymarket/markets/consolidate.json'

// Supported languages
type Language = 'english' | 'spanish' | 'portuguese'

// Translation structure for each market
interface Translation {
  language: string
  eventTitle: string
  title: string
  description: string
}

// Dashboard market structure with translations
interface DashboardMarket {
  id: string
  question: string
  slug: string
  description: string
  image: string
  icon: string
  eventTitle: string
  eventSlug: string
  eventId: string
  eventIcon: string
  negRisk: boolean
  outcomePrices?: string
  outcomes?: string
  translations: Translation[]
}

type DashboardData = Record<string, DashboardMarket[]>

// Map [lang] route param to Language
function langToLanguage(lang: string): Language {
  switch (lang) {
    case 'en':
      return 'english'
    case 'pt':
      return 'portuguese'
    default:
      return 'spanish'
  }
}

// Map [lang] to ISO code for translateBatch
function langToIso(lang: string): string {
  switch (lang) {
    case 'en':
      return 'en'
    case 'pt':
      return 'pt'
    default:
      return 'es'
  }
}

export interface MarketOGData {
  question: string
  description: string
  outcomePrices: string
  outcomes: string
  slug: string
  imageUrl: string
}

export async function getMarketOGData(
  slug: string,
  lang: string
): Promise<MarketOGData | null> {
  const language = langToLanguage(lang)

  // 1. Search in consolidate.json (free, fast, has translations)
  const topics = Object.keys(dashboardData)
  for (const topic of topics) {
    const markets = (dashboardData as DashboardData)[topic]
    const market = markets.find((m: DashboardMarket) => m.slug === slug)
    if (market) {
      const translation = market.translations.find(
        (t) => t.language === language
      )
      return {
        question: translation?.title || market.question,
        description: translation?.description || market.description,
        outcomePrices: market.outcomePrices || '[]',
        outcomes: market.outcomes || '["Yes", "No"]',
        slug: market.slug,
        imageUrl: market.image || market.icon || '',
      }
    }
  }

  // 2. Fallback: fetch from Polymarket API + translate
  try {
    const response = await fetch(`${GAMMA_API_URL}/markets?slug=${slug}`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    })

    if (!response.ok) return null

    const apiMarkets: PolymarketMarketDetail[] = await response.json()
    const market = apiMarkets[0]
    if (!market) return null

    // If lang is English, no translation needed
    if (lang === 'en') {
      return {
        question: market.question,
        description: market.description || '',
        outcomePrices: market.outcomePrices || '[]',
        outcomes: market.outcomes || '["Yes", "No"]',
        slug: market.slug,
        imageUrl: market.image || market.icon || '',
      }
    }

    // Translate to target language
    const toIso = langToIso(lang)
    const textsToTranslate = [
      market.question,
      market.description || '',
    ].filter(Boolean)
    const translations = await translateBatch(textsToTranslate, 'en', toIso)

    return {
      question: translations.get(market.question) || market.question,
      description:
        translations.get(market.description) || market.description || '',
      outcomePrices: market.outcomePrices || '[]',
      outcomes: market.outcomes || '["Yes", "No"]',
      slug: market.slug,
      imageUrl: market.image || market.icon || '',
    }
  } catch (error) {
    console.error('[getMarketOGData] Error:', error)
    return null
  }
}
