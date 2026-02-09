import { useQuery } from "@tanstack/react-query";

export type PriceHistoryDataPoint = {
  t: number; // timestamp
  p: number; // price
};

export type PriceHistory = {
  history: PriceHistoryDataPoint[];
};

export default function usePriceHistory(
  tokenId: string | undefined,
  interval: string = "1d",
  fidelity: string = "60"
) {
  return useQuery({
    queryKey: ["price-history", tokenId, interval, fidelity],
    queryFn: async (): Promise<PriceHistory> => {
      if (!tokenId) {
        return { history: [] };
      }

      const response = await fetch(
        `/api/polymarket/price-history?tokenId=${tokenId}&interval=${interval}&fidelity=${fidelity}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch price history");
      }

      return response.json();
    },
    enabled: !!tokenId,
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Refetch every minute
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}
