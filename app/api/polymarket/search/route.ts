import { NextRequest, NextResponse } from 'next/server'
import type {
  PolymarketSearchResponse,
  SearchResponse,
  SearchResult,
} from '@/types/search'
import { translateBatch, translateSearchQuery } from '@/lib/translation/service'

const POLYMARKET_SEARCH_API = 'https://gamma-api.polymarket.com/public-search'

/**
 * Transform Polymarket API response to our internal SearchResult format
 * Extracts individual markets from events and filters for active markets only
 */
async function transformResults(
  data: PolymarketSearchResponse,
  query: string
): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  // Collect all titles for batch translation (from markets, not events)
  const titlesToTranslate: string[] = []

  // Extract individual markets from events
  if (data.events && data.events.length > 0) {
    data.events.forEach((event) => {
      // Check if event has markets array
      if (event.markets && event.markets.length > 0) {
        event.markets.forEach((market) => {
          // Filter: only include active and not closed markets
          if (market.active === true && market.closed === false) {
            // Add market question to translation list
            titlesToTranslate.push(market.question)
          }
        })
      }
    })
  }

  // Collect tag labels for translation
  if (data.tags && data.tags.length > 0) {
    data.tags.forEach((tag) => {
      titlesToTranslate.push(tag.label)
    })
  }

  console.log('[transformResults] Collected', titlesToTranslate.length, 'titles for translation')

  // Translate all titles at once
  const translations = await translateBatch(titlesToTranslate, 'en', 'es')

  console.log('[transformResults] Translation batch complete, got', translations.size, 'translations')

  // Transform individual markets from events
  if (data.events && data.events.length > 0) {
    data.events.forEach((event) => {
      // Check if event has markets array
      if (event.markets && event.markets.length > 0) {
        event.markets.forEach((market) => {
          // Filter: only include active and not closed markets
          if (market.active === true && market.closed === false) {
            // Parse volume and liquidity (can be string or number)
            const volume24h = market.volume24hr || 0
            const volumeTotal = typeof market.volume === 'string'
              ? parseFloat(market.volume)
              : (market.volume || 0)
            const liquidityNum = market.liquidityNum ||
              (typeof market.liquidity === 'string'
                ? parseFloat(market.liquidity)
                : (market.liquidity || 0))

            // Generate description with metrics
            const parts = []
            if (volume24h > 0) {
              parts.push(`$${volume24h.toLocaleString()} vol 24h`)
            }
            if (liquidityNum > 0) {
              parts.push(`$${liquidityNum.toLocaleString()} liquidity`)
            }

            const description = parts.length > 0
              ? parts.join(' • ')
              : market.description || 'Mercado de predicción'

            // Get translated title or fallback to original
            const translatedTitle = translations.get(market.question) || market.question

            // Create result for this individual market
            results.push({
              id: market.id,
              category: 'Market' as const,
              title: translatedTitle,
              description,
              highlights: [query],
              metadata: {
                slug: market.slug,
                volume: volumeTotal.toString(),
                liquidity: liquidityNum.toString(),
                icon: market.icon || market.image || event.icon || event.image,
                image: market.image || market.icon || event.image || event.icon,
              },
            })
          }
        })
      }
    })
  }

  // Transform tags (unchanged)
  if (data.tags && data.tags.length > 0) {
    const tagResults = data.tags.map((tag) => {
      // Get translated title or fallback to original
      const translatedLabel = translations.get(tag.label) || tag.label

      return {
        id: tag.id,
        category: 'Tag' as const,
        title: translatedLabel,
        description: `${tag.event_count} ${tag.event_count === 1 ? 'mercado activo' : 'mercados activos'}`,
        highlights: [query],
        metadata: {
          slug: tag.slug,
        },
      }
    })
    results.push(...tagResults)
  }

  // Sort markets by volume (highest to lowest), keep tags at the end
  results.sort((a, b) => {
    // Tags always go after markets
    if (a.category === 'Tag' && b.category !== 'Tag') return 1
    if (a.category !== 'Tag' && b.category === 'Tag') return -1
    // Both are markets: sort by volume descending
    const volA = parseFloat(a.metadata?.volume || '0')
    const volB = parseFloat(b.metadata?.volume || '0')
    return volB - volA
  })

  console.log('[transformResults] Returning', results.length, 'total results (markets + tags), sorted by volume')

  return results
}

/**
 * GET /api/polymarket/search
 * Search markets, events, and tags from Polymarket API
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    // Validate query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          results: [],
          totalResults: 0,
          hasMore: false,
        } as SearchResponse,
        { status: 200 }
      )
    }

    console.log('[search/route] Original user query:', query)

    // Step 1: Translate user query from Spanish to English (with typo correction)
    const translatedQuery = await translateSearchQuery(query.trim(), 'es', 'en')
    console.log('[search/route] Translated query for API:', translatedQuery)

    const params = new URLSearchParams({
      q: translatedQuery, 
      limit_per_type: '5',
      search_tags: 'false', 
      search_profiles: 'false', 
      keep_closed_markets: '0', 
      optimized: 'true', 
    })

    const url = `${POLYMARKET_SEARCH_API}?${params.toString()}`

    // Fetch from Polymarket API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      console.error('[search/route] Polymarket API error:', response.status)
      return NextResponse.json(
        {
          results: [],
          totalResults: 0,
          hasMore: false,
        } as SearchResponse,
        { status: 200 }
      )
    }

    const data: PolymarketSearchResponse = await response.json()

    // Transform results to our format (now async for translation)
    const transformedResults = await transformResults(data, query)

    const searchResponse: SearchResponse = {
      results: transformedResults,
      totalResults: data.pagination?.totalResults || transformedResults.length,
      hasMore: data.pagination?.hasMore || false,
    }

    return NextResponse.json(searchResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('[search/route] Error:', error)

    // Return empty results on error instead of throwing
    return NextResponse.json(
      {
        results: [],
        totalResults: 0,
        hasMore: false,
      } as SearchResponse,
      { status: 200 }
    )
  }
}
