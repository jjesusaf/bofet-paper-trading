"use client";

import { useState, useEffect, useCallback } from "react";
import { useTrading } from "@/providers/TradingProvider";

export type OpenOrder = {
  id: string;
  market?: string;
  asset_id: string;
  original_size: string;
  price: string;
  side: "BUY" | "SELL";
  type?: string;
  owner?: string;
  maker_address?: string;
};

export default function useOpenOrders() {
  const { clobClient, safeAddress } = useTrading();
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!clobClient || !safeAddress) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await clobClient.getOpenOrders();


      // The response is an array of orders
      const ordersList = Array.isArray(response) ? response : [];
      setOrders(ordersList as OpenOrder[]);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch orders");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [clobClient, safeAddress]);

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!clobClient) {
        throw new Error("Trading session not initialized");
      }


      try {
        await clobClient.cancelOrder({ orderID: orderId });

        // Refresh orders list after cancellation
        await fetchOrders();

        return { success: true };
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to cancel order");
        throw error;
      }
    },
    [clobClient, fetchOrders]
  );

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    isLoading,
    error,
    cancelOrder,
    refetch: fetchOrders,
  };
}
