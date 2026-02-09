"use client";

import { useState, useCallback } from "react";
import { useTrading } from "@/providers/TradingProvider";
import useBridgeDeposit from "@/hooks/useBridgeDeposit";
import {
  createNativeUsdcTransferTx,
} from "@/utils/transfer";
import {
  formatUsdcAmount,
  meetsMinimumDeposit,
  waitForBridgeCompletion,
  BridgeDepositError,
  type BridgeStatusResult,
} from "@/utils/bridge";

const CONVERT_DESCRIPTION = "Convert USDC to USDC.e via bridge";
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

export type ConvertStatus =
  | "idle"
  | "fetching-address"
  | "sending-usdc"
  | "waiting-bridge"
  | "waiting-bridge-extended"
  | "completed"
  | "failed";

export default function useAutoConvert() {
  const { safeAddress, relayClient } = useTrading();
  const { fetchDepositAddress } = useBridgeDeposit(safeAddress);

  const [isConverting, setIsConverting] = useState(false);
  const [status, setStatus] = useState<ConvertStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [isExtendedWait, setIsExtendedWait] = useState(false);
  const [lastBridgeResult, setLastBridgeResult] =
    useState<BridgeStatusResult | null>(null);

  const convert = useCallback(
    async (amount: bigint): Promise<void> => {
      if (!safeAddress || !relayClient) {
        throw new Error("Trading session not initialized");
      }
      const amountUsd = formatUsdcAmount(amount);
      if (!meetsMinimumDeposit(amountUsd)) {
        throw new Error(
          `Bridge requires a minimum of $2 to convert. Amount $${amountUsd.toFixed(2)} is below the minimum. Please convert at least $2.`
        );
      }

      setIsConverting(true);
      setStatus("fetching-address");
      setError(null);
      setIsExtendedWait(false);
      setLastBridgeResult(null);

      try {
        const depositAddress = await fetchDepositAddress();
        setStatus("sending-usdc");

        const recipient = depositAddress.startsWith("0x")
          ? (depositAddress as `0x${string}`)
          : (`0x${depositAddress}` as `0x${string}`);
        const tx = createNativeUsdcTransferTx({ recipient, amount });

        const response = await relayClient.execute([tx], CONVERT_DESCRIPTION);
        await response.wait();

        setStatus("waiting-bridge");

        const waitWithRetry = async (attempt: number): Promise<void> => {
          try {
            await waitForBridgeCompletion(depositAddress, {
              onStatusChange: (result) => {
                setLastBridgeResult(result);
                if (result.kind === "pending") {
                  setStatus("waiting-bridge");
                }
              },
              onExtendedWait: (elapsedSeconds) => {
                setIsExtendedWait(true);
                setStatus("waiting-bridge-extended");
              },
            });
            setStatus("completed");
          } catch (err) {
            if (err instanceof BridgeDepositError) {
              setStatus("failed");
              setError(err);
              throw err;
            }
            if (attempt < RETRY_ATTEMPTS) {
              await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
              return waitWithRetry(attempt + 1);
            }
            setStatus("failed");
            const e = err instanceof Error ? err : new Error(String(err));
            setError(e);
            throw e;
          }
        };
        await waitWithRetry(1);
      } catch (err) {
        setStatus("failed");
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsConverting(false);
      }
    },
    [safeAddress, relayClient, fetchDepositAddress]
  );

  return {
    convert,
    isConverting,
    status,
    error,
    isExtendedWait,
    lastBridgeResult,
  };
}
