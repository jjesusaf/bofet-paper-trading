"use client";

import { useState } from "react";
import { useTrading } from "@/providers/TradingProvider";
import useMarkets from "@/hooks/useMarkets";
import { type CategoryId, DEFAULT_CATEGORY, getCategoryById } from "@/constants/categories";
import { useDictionary } from "@/providers/dictionary-provider";

import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import MarketCard from "@/components/Trading/Markets/MarketCard";
import CategoryTabs from "@/components/Trading/Markets/CategoryTabs";
import OrderPlacementModal from "@/components/Trading/OrderModal";

export default function HighVolumeMarkets() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>(DEFAULT_CATEGORY);
  const [selectedOutcome, setSelectedOutcome] = useState<{
    marketTitle: string;
    outcome: string;
    price: number;
    tokenId: string;
    negRisk: boolean;
  } | null>(null);

  const { isGeoblocked } = useTrading();

  const { data: markets, isLoading, error } = useMarkets({
    limit: 10,
    categoryId: activeCategory,
  });

  const { dict } = useDictionary();
  const category = getCategoryById(activeCategory);
  // Get translated label for the category, same logic as CategoryTabs
  const categoryLabel = (dict.exploreMarkets?.categories as any)?.[activeCategory] ?? category?.label ?? dict.trading?.tabs?.markets ?? "Markets";

  const handleOutcomeClick = (
    marketTitle: string,
    outcome: string,
    price: number,
    tokenId: string,
    negRisk: boolean
  ) => {
    setSelectedOutcome({ marketTitle, outcome, price, tokenId, negRisk });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOutcome(null);
  };

  const handleCategoryChange = (categoryId: CategoryId) => {
    setActiveCategory(categoryId);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Category Tabs */}
        <CategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">
            {categoryLabel} Bofets 
          </h3>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="navigation-loader"></div>
            <p className="mt-4 text-sm text-gray-400">
              {(dict.trading?.markets?.loadingMarkets ?? "Loading {{category}} markets...").replace("{{category}}", categoryLabel.toLowerCase())}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <ErrorState error={error} title={dict.trading?.markets?.errorLoading ?? "Error loading markets"} />
        )}

        {/* Empty State */}
        {!isLoading && !error && (!markets || markets.length === 0) && (
          <EmptyState
            title={dict.trading?.markets?.noMarkets ?? "No Markets Available"}
            message={(dict.trading?.markets?.noMarketsMessage ?? "No active {{category}} markets found.").replace("{{category}}", categoryLabel.toLowerCase())}
          />
        )}

        {/* Market Cards */}
        {!isLoading && !error && markets && markets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {markets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                disabled={isGeoblocked}
                onOutcomeClick={handleOutcomeClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Order Placement Modal */}
      {selectedOutcome && (
        <OrderPlacementModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          marketTitle={selectedOutcome.marketTitle}
          outcome={selectedOutcome.outcome}
          currentPrice={selectedOutcome.price}
          tokenId={selectedOutcome.tokenId}
          negRisk={selectedOutcome.negRisk}
        />
      )}
    </>
  );
}
