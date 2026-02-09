import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Side, OrderType } from "@polymarket/clob-client";
import type { ClobClient, UserOrder, UserMarketOrder } from "@polymarket/clob-client";

export type OrderParams = {
  tokenId: string;
  size: number;
  price?: number;
  side: "BUY" | "SELL";
  negRisk?: boolean;
  isMarketOrder?: boolean;
};

export default function useClobOrder(
  clobClient: ClobClient | null,
  walletAddress: string | undefined
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const submitOrder = useCallback(
    async (params: OrderParams) => {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      if (!clobClient) {
        throw new Error("CLOB client not initialized");
      }

      setIsSubmitting(true);
      setError(null);
      setOrderId(null);

      try {
        const side = params.side === "BUY" ? Side.BUY : Side.SELL;
        let response;

        if (params.isMarketOrder) {
          // For market orders, use createAndPostMarketOrder with FOK
          // BUY orders need amount in dollars (size * askPrice)
          // SELL orders need amount in shares
          let marketAmount: number;

          if (side === Side.BUY) {
            // Get the ask price (price to buy at)
            const priceResponse = await clobClient.getPrice(
              params.tokenId,
              Side.SELL // Get sell side price = ask price for buyers
            );
            const askPrice = parseFloat(priceResponse.price);

            if (isNaN(askPrice) || askPrice <= 0 || askPrice >= 1) {
              throw new Error("Unable to get valid market price");
            }

            // Convert shares to dollar amount for BUY orders
            marketAmount = params.size * askPrice;
          } else {
            // For SELL orders, amount is in shares
            marketAmount = params.size;
          }

          const marketOrder: UserMarketOrder = {
            tokenID: params.tokenId,
            amount: marketAmount,
            side,
            feeRateBps: 0,
          };

          response = await clobClient.createAndPostMarketOrder(
            marketOrder,
            { negRisk: params.negRisk },
            OrderType.FOK // Fill or Kill for market orders
          );
        } else {
          // For limit orders, use createAndPostOrder with GTC
          if (!params.price) {
            throw new Error("Price required for limit orders");
          }

          const limitOrder: UserOrder = {
            tokenID: params.tokenId,
            price: params.price,
            size: params.size,
            side,
            feeRateBps: 0,
            expiration: 0,
            taker: "0x0000000000000000000000000000000000000000",
          };

          response = await clobClient.createAndPostOrder(
            limitOrder,
            { negRisk: params.negRisk },
            OrderType.GTC // Good Till Cancelled for limit orders
          );
        }

        if (response.orderID) {
          setOrderId(response.orderID);
          queryClient.invalidateQueries({ queryKey: ["active-orders"] });
          queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
          return { success: true, orderId: response.orderID };
        } else {
          throw new Error("Order submission failed");
        }
      } catch (err: unknown) {
        // Parse error from Polymarket API
        let errorMessage = "Failed to submit order";

        // Debug: log full error structure
        console.error('[useClobOrder] Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));

        // Try to extract error from different structures
        let apiError: string | undefined;

        if (err && typeof err === 'object') {
          // Try err.data.error (direct API error)
          if ('data' in err && (err as any).data?.error) {
            apiError = (err as any).data.error;
          }
          // Try err.response.data.error (Axios error)
          else if ('response' in err && (err as any).response?.data?.error) {
            apiError = (err as any).response.data.error;
          }
          // Try err.cause (Error with cause)
          else if ('cause' in err && typeof (err as any).cause === 'object') {
            const cause = (err as any).cause;
            if (cause.data?.error) {
              apiError = cause.data.error;
            } else if (cause.response?.data?.error) {
              apiError = cause.response.data.error;
            }
          }
          // Try err.message (generic Error)
          else if (err instanceof Error) {
            apiError = err.message;
          }
        }

        if (apiError && typeof apiError === 'string') {
          // Check for minimum size error
          const minSizeMatch = apiError.match(/Size \([\d.]+\) lower than the minimum: ([\d.]+)/);
          if (minSizeMatch) {
            const minSize = minSizeMatch[1];
            errorMessage = `El mercado requiere un mínimo de ${minSize} shares. Tu orden fue ajustada a un tamaño menor debido a tu balance disponible. Deposita más fondos para alcanzar el mínimo.`;
          } else {
            // Use the API error message as-is for other errors
            errorMessage = apiError;
          }
        }

        console.error('[useClobOrder] Parsed error:', { originalError: err, errorMessage });

        const error = new Error(errorMessage);
        setError(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clobClient, walletAddress, queryClient]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!clobClient) {
        throw new Error("CLOB client not initialized");
      }

      setIsSubmitting(true);
      setError(null);

      try {
        await clobClient.cancelOrder({ orderID: orderId });
        queryClient.invalidateQueries({ queryKey: ["active-orders"] });
        return { success: true };
      } catch (err: unknown) {
        const error =
          err instanceof Error ? err : new Error("Failed to cancel order");
        setError(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clobClient, queryClient]
  );

  return {
    submitOrder,
    cancelOrder,
    isSubmitting,
    error,
    orderId,
  };
}
