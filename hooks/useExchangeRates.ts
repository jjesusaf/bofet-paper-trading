import { useQuery } from "@tanstack/react-query";
import type { ExchangeRates } from "@/utils/onrampUrl";

const FRANKFURTER_URL =
  "https://api.frankfurter.app/latest?from=USD&to=MXN,EUR";

/** Response: 1 USD = rates.MXN MXN, so 1 MXN = 1/rates.MXN USD. */
async function fetchExchangeRates(): Promise<ExchangeRates> {
  const res = await fetch(FRANKFURTER_URL);
  if (!res.ok) throw new Error("Failed to fetch exchange rates");
  const data = (await res.json()) as { rates: { MXN?: number; EUR?: number } };
  const { MXN, EUR } = data.rates ?? {};
  return {
    MXN_TO_USD: MXN != null && MXN > 0 ? 1 / MXN : undefined,
    EUR_TO_USD: EUR != null && EUR > 0 ? 1 / EUR : undefined,
  };
}

/** Fetches rough MXN/EUR to USD rates from a public API (Frankfurter). Used for min-amount conversion and display. */
export default function useExchangeRates() {
  const query = useQuery({
    queryKey: ["exchangeRates", "USD"],
    queryFn: fetchExchangeRates,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });
  return {
    rates: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
