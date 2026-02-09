import { useState, useCallback } from "react";
import { RelayClient } from "@polymarket/builder-relayer-client";
import {
  createNativeUsdcTransferTx,
  createUsdcTransferTx,
  TransferParams,
} from "@/utils/transfer";

export type TransferToken = "USDC" | "USDC.e";

export type TransferUsdcParams = TransferParams & {
  token?: TransferToken;
};

function isAuthError(err: unknown): boolean {
  // Check if error is 401 unauthorized
  if (err instanceof Error) {
    const errMsg = err.message.toLowerCase();
    return (
      errMsg.includes("invalid authorization") ||
      errMsg.includes("401") ||
      errMsg.includes("unauthorized")
    );
  }
  return false;
}

export default function useUsdcTransfer() {
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const transferUsdc = useCallback(
    async (
      relayClient: RelayClient,
      params: TransferUsdcParams,
      reinitializeRelayClient?: () => Promise<RelayClient>
    ): Promise<boolean> => {
      setIsTransferring(true);
      setError(null);

      const executeTransfer = async (client: RelayClient): Promise<void> => {
        const token = params.token ?? "USDC.e";
        const transferTx =
          token === "USDC"
            ? createNativeUsdcTransferTx(params)
            : createUsdcTransferTx(params);

        const response = await client.execute(
          [transferTx],
          `Transfer ${token} to ${params.recipient}`
        );

        await response.wait();
      };

      try {
        await executeTransfer(relayClient);
        return true;
      } catch (err) {
        console.error("Transfer error:", err);

        // If auth error and we can reinitialize, try once more
        if (isAuthError(err) && reinitializeRelayClient) {
          console.log("[useUsdcTransfer] Auth error detected, reinitializing credentials...");
          try {
            const newClient = await reinitializeRelayClient();
            console.log("[useUsdcTransfer] Credentials reinitialized, retrying transfer...");
            await executeTransfer(newClient);
            console.log("[useUsdcTransfer] Transfer successful after reinitializing");
            return true;
          } catch (retryErr) {
            console.error("[useUsdcTransfer] Retry failed:", retryErr);
            const error =
              retryErr instanceof Error
                ? retryErr
                : new Error("Failed to transfer USDC / USDC.e after reinitializing");
            setError(error);
            throw error;
          }
        }

        // No retry or retry not available
        const error =
          err instanceof Error
            ? err
            : new Error("Failed to transfer USDC / USDC.e");
        setError(error);
        throw error;
      } finally {
        setIsTransferring(false);
      }
    },
    []
  );

  return {
    isTransferring,
    error,
    transferUsdc,
  };
}
