"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { PolymarketMarket } from "@/hooks/useMarkets";
import PreviewMarketCard from "./PreviewMarketCard";
import CategoryTabs from "./CategoryTabs";
import ErrorState from "@/components/shared/ErrorState";
import { useDictionary } from "@/providers/dictionary-provider";
import { useNavigationLoading } from "@/providers/NavigationLoadingProvider";
import { DEFAULT_CATEGORY, type CategoryId } from "@/constants/categories";

export default function PreviewMarketCards() {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>(DEFAULT_CATEGORY);
  const params = useParams();
  const router = useRouter();
  const lang = params?.lang || 'es';
  const { dict } = useDictionary();
  const { startLoading } = useNavigationLoading();

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/polymarket/markets?limit=16&preview=true&topic=${activeCategory}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch markets");
        }

        const data: PolymarketMarket[] = await response.json();
        setMarkets(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
  }, [activeCategory]);

  const handleCardClick = (marketSlug: string) => {
    try {
      // Start loading animation before navigation
      startLoading();
      const marketUrl = `/${lang}/market/${marketSlug}`;
      router.push(marketUrl);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const loadingMessage = dict.trading?.markets?.loadingMarkets 
    ? dict.trading.markets.loadingMarkets.replace("{{category}}", "markets")
    : "Loading markets...";

  // Render content based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="navigation-loader"></div>
          <p className="mt-4 text-sm text-gray-400">
            {loadingMessage}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <ErrorState 
          error={error} 
          title={dict.trading?.markets?.errorLoading ?? "Error loading markets"} 
        />
      );
    }

    if (!markets || markets.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>{dict.trading?.markets?.noMarkets ?? "No markets available"}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {markets.map((market) => (
          <div
            key={market.id}
            onClick={() => handleCardClick(market.slug)}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick(market.slug);
              }
            }}
            aria-label="View market details"
          >
            <PreviewMarketCard market={market} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Category Tabs */}
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />
      {/* Market Cards Grid */}
      {renderContent()}
    </div>
  );
}
