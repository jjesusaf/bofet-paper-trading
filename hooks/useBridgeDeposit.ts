"use client";

import { useState, useCallback, useEffect } from "react";
import { fetchBridgeDepositAddress } from "@/utils/bridge";

const DEPOSIT_CACHE_URL = "/api/polymarket/bridge/deposit-cache";

/**
 * Fetches and caches bridge deposit address by Safe via Redis-backed API.
 * GET implements get-or-fetch: returns cached address or, on miss, server
 * fetches from Polymarket, writes to Redis with 7-day TTL, and returns it.
 *
 * @param safeAddress - Safe address from useTrading()
 */
export default function useBridgeDeposit(safeAddress: string | undefined) {
  const [depositAddress, setDepositAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // On mount / safeAddress change: load from deposit-cache (get-or-fetch)
  useEffect(() => {
    if (!safeAddress) {
      setDepositAddress(null);
      setError(null);
      return;
    }
    let cancelled = false;
    const url = `${DEPOSIT_CACHE_URL}?safeAddress=${encodeURIComponent(safeAddress)}`;
    fetch(url)
      .then((res) => {
        if (cancelled) return;
        if (!res.ok) {
          setDepositAddress(null);
          return;
        }
        return res.json() as Promise<{ value: string | null }>;
      })
      .then((data) => {
        if (cancelled || !data) return;
        if (data.value) {
          setDepositAddress(data.value);
          setError(null);
        } else {
          setDepositAddress(null);
        }
      })
      .catch(() => {
        if (!cancelled) setDepositAddress(null);
      });
    return () => {
      cancelled = true;
    };
  }, [safeAddress]);

  const fetchDepositAddress = useCallback(async (): Promise<string> => {
    if (!safeAddress) {
      throw new Error("Safe address is required");
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = `${DEPOSIT_CACHE_URL}?safeAddress=${encodeURIComponent(safeAddress)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as { value: string | null };
        if (data.value) {
          setDepositAddress(data.value);
          return data.value;
        }
      }
      // Fallback: deposit-cache failed or returned null — call bridge API directly
      const response = await fetchBridgeDepositAddress(safeAddress);
      const evm = response.address?.evm;
      if (!evm) {
        throw new Error("No EVM deposit address in response");
      }
      setDepositAddress(evm);
      // Optionally write to cache for future requests
      try {
        await fetch(DEPOSIT_CACHE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ safeAddress, depositAddress: evm }),
        });
      } catch {
        // ignore cache write failure
      }
      return evm;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [safeAddress]);

  return {
    depositAddress,
    isLoading,
    error,
    fetchDepositAddress,
  };
}
