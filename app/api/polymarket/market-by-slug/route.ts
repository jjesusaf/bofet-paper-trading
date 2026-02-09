import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/constants/api";
import { translateBatch } from '@/lib/translation/service';
import type { PolymarketMarketDetail } from '@/types/search';

// Import dashboard markets organized by topic with translations
import dashboardData from "../markets/consolidate.json";

// Supported languages
type Language = "english" | "spanish" | "portuguese";

// Translation structure for each market
interface Translation {
  language: string;
  eventTitle: string;
  title: string;
  description: string;
}

// Dashboard market structure with translations
interface DashboardMarket {
  id: string;
  question: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  eventTitle: string;
  eventSlug: string;
  eventId: string;
  eventIcon: string;
  negRisk: boolean;
  translations: Translation[];
}

// Dashboard data structure organized by topic
type DashboardData = Record<string, DashboardMarket[]>;

// Helper to get translation for a market
function getTranslation(
  market: DashboardMarket,
  language: Language
): Translation | undefined {
  return market.translations.find((t) => t.language === language);
}

// Helper to apply translation to market properties
function applyTranslation(
  market: DashboardMarket,
  language: Language
): DashboardMarket {
  const translation = getTranslation(market, language);
  if (!translation) {
    return market;
  }
  return {
    ...market,
    question: translation.title,
    description: translation.description,
    eventTitle: translation.eventTitle,
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("slug");
  const preview = searchParams.get("preview") === "true";

  // Get language parameter (default: spanish)
  const languageParam = searchParams.get("language") || "spanish";
  const language: Language = ["english", "spanish", "portuguese"].includes(
    languageParam
  )
    ? (languageParam as Language)
    : "spanish";

  if (!slug) {
    return NextResponse.json(
      { error: "slug parameter is required" },
      { status: 400 }
    );
  }

  // Search for the market by slug across all topics
  let foundMarket: DashboardMarket | null = null;
  const topics = Object.keys(dashboardData);

  for (const topic of topics) {
    const markets = (dashboardData as DashboardData)[topic];
    const market = markets.find((m: DashboardMarket) => m.slug === slug);
    if (market) {
      foundMarket = market;
      break;
    }
  }

  // If market not found in consolidate.json, fetch directly from Polymarket API
  if (!foundMarket) {
    try {
      console.log(`[market-by-slug] Market not in consolidate.json, fetching from Polymarket API: ${slug}`);

      // Fetch market from Polymarket API by slug
      const response = await fetch(
        `${GAMMA_API_URL}/markets?slug=${slug}`,
        {
          headers: { "Content-Type": "application/json" },
          next: { revalidate: 60 },
        }
      );

      if (!response.ok) {
        console.warn(`[market-by-slug] Failed to fetch market ${slug}: ${response.status}`);
        return NextResponse.json(
          { error: "Market not found" },
          { status: 404 }
        );
      }

      const apiMarkets: PolymarketMarketDetail[] = await response.json();

      // API returns an array, get the first market
      const market = apiMarkets[0];

      if (!market) {
        return NextResponse.json({ error: "Market not found" }, { status: 404 });
      }

      // Translate question and description to Spanish
      const textsToTranslate = [market.question, market.description];
      const translations = await translateBatch(textsToTranslate, 'en', 'es');

      const translatedQuestion = translations.get(market.question) || market.question;
      const translatedDescription = translations.get(market.description) || market.description;

      // Return translated market
      const translatedMarket = {
        ...market,
        question: translatedQuestion,
        description: translatedDescription,
      };

      console.log(`[market-by-slug] Successfully fetched and translated market from API: ${market.slug}`);
      return NextResponse.json(translatedMarket);
    } catch (error) {
      console.error('[market-by-slug] Error fetching market from Polymarket API:', error);
      return NextResponse.json(
        { error: "Market not found" },
        { status: 404 }
      );
    }
  }

  // If preview mode (non-logged-in users), return static market from consolidate.json
  if (preview) {
    // Apply translations to the market
    const translatedMarket = applyTranslation(foundMarket, language);

    // Filter out if closed or not accepting orders
    if (
      (translatedMarket as any).acceptingOrders === false ||
      (translatedMarket as any).closed === true ||
      !(translatedMarket as any).clobTokenIds
    ) {
      return NextResponse.json(
        { error: "Market is closed or not accepting orders" },
        { status: 404 }
      );
    }

    return NextResponse.json(translatedMarket);
  }

  // For logged-in users, fetch market from Polymarket API
  try {
    const response = await fetch(
      `${GAMMA_API_URL}/markets/${foundMarket.id}`,
      {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch market ${foundMarket.id}: ${response.status}`
      );
      return NextResponse.json(
        { error: "Failed to fetch market from Polymarket API" },
        { status: response.status }
      );
    }

    const market = await response.json();

    // Apply translation based on language
    const translatedPredefined = applyTranslation(foundMarket, language);

    // Merge API data with translated predefined event metadata
    const enrichedMarket = {
      ...market,
      question: translatedPredefined.question,
      description: translatedPredefined.description,
      eventTitle: translatedPredefined.eventTitle,
      eventSlug: foundMarket.eventSlug,
      eventId: foundMarket.eventId,
      eventIcon: foundMarket.eventIcon,
      negRisk: foundMarket.negRisk,
    };

    // Filter out if closed or not accepting orders
    if (
      enrichedMarket.acceptingOrders === false ||
      enrichedMarket.closed === true ||
      !enrichedMarket.clobTokenIds
    ) {
      return NextResponse.json(
        { error: "Market is closed or not accepting orders" },
        { status: 404 }
      );
    }

    return NextResponse.json(enrichedMarket);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch market";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error fetching market by slug:", {
      message: errorMessage,
      stack: errorStack,
      error: error,
      slug,
    });

    return NextResponse.json(
      {
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        details:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
