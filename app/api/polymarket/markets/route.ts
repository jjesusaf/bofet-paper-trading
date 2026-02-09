import { NextRequest, NextResponse } from "next/server";
import { GAMMA_API_URL } from "@/constants/api";

// Import dashboard markets organized by topic with translations
import dashboardData from "./consolidate.json";

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

// Valid topic keys
const VALID_TOPICS = [
  "trending",
  "politics",
  "finance",
  "crypto",
  "sports",
  "tech",
  "culture",
  "geopolitics",
] as const;

type Topic = (typeof VALID_TOPICS)[number];

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
  const limit = searchParams.get("limit") || "16";
  const preview = searchParams.get("preview") === "true";

  // Get language parameter (default: spanish)
  const languageParam = searchParams.get("language") || "spanish";
  const language: Language = ["english", "spanish", "portuguese"].includes(
    languageParam
  )
    ? (languageParam as Language)
    : "spanish";

  // Get topic parameter (default: trending)
  const topicParam = searchParams.get("topic") || "trending";
  const topic: Topic = VALID_TOPICS.includes(topicParam as Topic)
    ? (topicParam as Topic)
    : "trending";

  // If preview mode (non-logged-in users), return static markets from consolidate.json
  if (preview) {
    // Get markets for the selected topic
    const topicMarkets =
      (dashboardData as DashboardData)[topic] ||
      (dashboardData as DashboardData)["trending"] ||
      [];

    // Apply translations to each market
    const translatedMarkets = topicMarkets.map((market) =>
      applyTranslation(market, language)
    );

    // Filter out closed markets and markets not accepting orders
    const validMarkets = translatedMarkets.filter((market: any) => {
      if (market.acceptingOrders === false) return false;
      if (market.closed === true) return false;
      if (!market.clobTokenIds) return false;
      return true;
    });

    // Markets are displayed in the order they appear in consolidate.json (curated order)
    // Apply limit
    const limitedMarkets = validMarkets.slice(0, parseInt(limit));

    return NextResponse.json(limitedMarkets);
  }

  // For logged-in users, fetch predefined markets from Polymarket API
  try {
    // Get markets for the selected topic
    const topicMarkets =
      (dashboardData as DashboardData)[topic] || (dashboardData as DashboardData)["trending"] || [];

    // Fetch each predefined market by ID in parallel
    const marketPromises = topicMarkets.map(async (predefined) => {
      try {
        const response = await fetch(
          `${GAMMA_API_URL}/markets/${predefined.id}`,
          {
            headers: { "Content-Type": "application/json" },
            next: { revalidate: 60 },
          }
        );

        if (!response.ok) {
          console.warn(`Failed to fetch market ${predefined.id}: ${response.status}`);
          return null;
        }

        const market = await response.json();

        // Apply translation based on language
        const translatedPredefined = applyTranslation(predefined, language);

        // Merge API data with translated predefined event metadata
        return {
          ...market,
          question: translatedPredefined.question,
          description: translatedPredefined.description,
          eventTitle: translatedPredefined.eventTitle,
          eventSlug: predefined.eventSlug,
          eventId: predefined.eventId,
          eventIcon: predefined.eventIcon,
          negRisk: predefined.negRisk,
        };
      } catch (err) {
        console.warn(`Error fetching market ${predefined.id}:`, err);
        return null;
      }
    });

    const enrichedMarkets = (await Promise.all(marketPromises)).filter(Boolean);

    // Filter out invalid markets (closed, not accepting orders, no clobTokenIds)
    const validMarkets = enrichedMarkets.filter((market: any) => {
      if (market.acceptingOrders === false) return false;
      if (market.closed === true) return false;
      if (!market.clobTokenIds) return false;
      return true;
    });

    // Markets are displayed in the order they appear in consolidate.json (curated order)
    // Apply limit
    const limitedMarkets = validMarkets.slice(0, parseInt(limit));

    return NextResponse.json(limitedMarkets);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch markets";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Error fetching markets:", {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });

    return NextResponse.json(
      {
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
        } : undefined,
      },
      { status: 500 }
    );
  }
}
