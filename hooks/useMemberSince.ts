import { useQuery } from "@tanstack/react-query";

export default function useMemberSince(safeAddress: string | undefined) {
  return useQuery({
    queryKey: ["member-since", safeAddress],
    queryFn: async (): Promise<string | null> => {
      if (!safeAddress) {
        console.log("[useMemberSince] No safe address provided, returning null");
        return null;
      }

      console.log("[useMemberSince] Fetching member since date", { safeAddress });

      try {
        const response = await fetch(
          `/api/redis?key=${encodeURIComponent(safeAddress)}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("[useMemberSince] Failed to fetch member since date - HTTP error", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            safeAddress,
          });
          throw new Error("Failed to fetch member since date");
        }

        const data = await response.json();
        console.log("[useMemberSince] Successfully fetched member since date", {
          safeAddress,
          value: data.value,
          hasValue: !!data.value,
        });
        
        return data.value; // Returns ISO timestamp string or null
      } catch (error) {
        console.error("[useMemberSince] Failed to fetch member since date - Exception", {
          error,
          safeAddress,
        });
        throw error;
      }
    },
    enabled: !!safeAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
