import { useQuery } from "@tanstack/react-query";
import { useTrading } from "@/providers/TradingProvider";
import { Side } from "@polymarket/clob-client";
import type { PolymarketMarket } from "./useMarkets";

interface UseMarketBySlugOptions {
  slug: string;
  enabled?: boolean;
}

export default function useMarketBySlug({ slug, enabled = true }: UseMarketBySlugOptions) {
  const { clobClient } = useTrading();

  return useQuery({
    queryKey: ["market-by-slug", slug, !!clobClient],
    queryFn: async (): Promise<PolymarketMarket> => {
      const url = `/api/polymarket/market-by-slug?slug=${encodeURIComponent(slug)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch market");
      }

      const market: PolymarketMarket = await response.json();

      // Fetch realtime prices and order books from CLOB if client is available
      if (clobClient && market.clobTokenIds && market.closed !== true &&
        market.acceptingOrders !== false) {
        try {
          const tokenIds = JSON.parse(market.clobTokenIds);
          const priceMap: Record<string, any> = {};
          const orderBookMap: Record<string, any> = {};

          await Promise.all(
            tokenIds.map(async (tokenId: string) => {
              try {
                // Fetch both prices and order book in parallel
                const [bidResponse, askResponse, orderBook] = await Promise.all([
                  clobClient.getPrice(tokenId, Side.BUY),
                  clobClient.getPrice(tokenId, Side.SELL),
                  clobClient.getOrderBook(tokenId),
                ]);

                const bidPrice = parseFloat(bidResponse.price);
                const askPrice = parseFloat(askResponse.price);

                if (
                  !isNaN(bidPrice) &&
                  !isNaN(askPrice) &&
                  bidPrice > 0 &&
                  bidPrice < 1 &&
                  askPrice > 0 &&
                  askPrice < 1
                ) {
                  priceMap[tokenId] = {
                    bidPrice,
                    askPrice,
                    midPrice: (bidPrice + askPrice) / 2,
                    spread: askPrice - bidPrice,
                  };
                }

                // Store order book data only if it has valid asks and bids arrays
                if (orderBook && orderBook.asks && orderBook.bids &&
                    Array.isArray(orderBook.asks) && Array.isArray(orderBook.bids)) {
                  orderBookMap[tokenId] = orderBook;
                }
              } catch (error) {
                console.warn(
                  `Error fetching data for token ${tokenId}:`,
                  error
                );
              }
            })
          );

          market.realtimePrices = priceMap;
          market.orderBooks = orderBookMap;
        } catch (error) {
          console.warn(
            `Failed to fetch market data for ${market.id}:`,
            error
          );
        }
      }

      return market;
    },
    enabled: enabled && !!slug,
    staleTime: 1_000,
    refetchInterval: 2_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    gcTime: 5_000,
  });
}
