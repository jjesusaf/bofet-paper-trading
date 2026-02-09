"use client";

import { useState, useCallback } from "react";
import { polygon } from "viem/chains";
import { useWallet } from "@/providers/WalletContext";
import {
  fetchBridgeDepositAddress,
  formatUsdcAmount,
  meetsMinimumDeposit,
  waitForBridgeCompletion,
  BridgeTimeoutError,
  BridgeDepositError,
} from "@/utils/bridge";
import { buildEoaTransferUsdcToAddress } from "@/utils/transfer";
import {
  getPolygonEip1559GasParams,
  getPublicPolygonClient,
} from "@/utils/polygonGas";

const MAGIC_RATE_LIMIT_RETRY_MS = 15_000;

function isMagicRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const causeMsg =
    err instanceof Error &&
    (err as Error & { cause?: { message?: string } }).cause?.message
      ? (err as Error & { cause: { message?: string } }).cause.message
      : "";
  const details =
    typeof (err as Error & { details?: string })?.details === "string"
      ? (err as Error & { details: string }).details
      : "";
  const fullText = [msg, causeMsg, details].filter(Boolean).join(" ");
  return (
    fullText.includes("rate limit exhausted") ||
    fullText.includes("retry in") ||
    fullText.includes("Too many requests") ||
    fullText.includes("[-32603]")
  );
}

export type EoaConvertStatus =
  | "idle"
  | "fetching-address"
  | "sending-usdc"
  | "waiting-bridge"
  | "waiting-bridge-extended"
  | "completed"
  | "failed";

export default function useEoaBridgeConvert() {
  const { eoaAddress, walletClient, publicClient } = useWallet();

  const [isConverting, setIsConverting] = useState(false);
  const [status, setStatus] = useState<EoaConvertStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [isExtendedWait, setIsExtendedWait] = useState(false);

  const convertUsdcToUsdce = useCallback(
    async (amount: bigint): Promise<void> => {
      if (!eoaAddress) {
        throw new Error("Wallet not connected");
      }
      if (!walletClient || !publicClient) {
        throw new Error("Wallet not ready for transactions");
      }

      const amountUsd = formatUsdcAmount(amount);
      if (!meetsMinimumDeposit(amountUsd)) {
        const err = new Error(
          `Bridge requires a minimum of $2 to convert. Amount $${amountUsd.toFixed(2)} is below the minimum. Please convert at least $2.`
        );
        setError(err);
        throw err;
      }

      setIsConverting(true);
      setStatus("fetching-address");
      setError(null);
      setIsExtendedWait(false);

      try {
        const response = await fetchBridgeDepositAddress(eoaAddress);
        const depositAddress = response.address?.evm;
        if (!depositAddress) {
          throw new Error("No EVM deposit address in response");
        }

        setStatus("sending-usdc");
        const tx = buildEoaTransferUsdcToAddress(depositAddress, amount);
        const publicRpc = getPublicPolygonClient();
        const gasParams = await getPolygonEip1559GasParams(publicRpc);
        let hash: `0x${string}` | null = null;
        let lastSendErr: unknown;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            hash = await walletClient.sendTransaction({
              account: eoaAddress,
              chain: polygon,
              to: tx.to,
              data: tx.data,
              value: tx.value,
              maxFeePerGas: gasParams.maxFeePerGas,
              maxPriorityFeePerGas: gasParams.maxPriorityFeePerGas,
            });
            break;
          } catch (sendErr) {
            lastSendErr = sendErr;
            if (attempt === 0 && isMagicRateLimitError(sendErr)) {
              await new Promise((r) => setTimeout(r, MAGIC_RATE_LIMIT_RETRY_MS));
              continue;
            }
            if (attempt === 1 && isMagicRateLimitError(sendErr)) {
              throw new Error(
                "Too many requests. Please wait a moment and try again."
              );
            }
            throw sendErr;
          }
        }
        if (hash == null) throw lastSendErr;
        let lastReceiptErr: unknown;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            await publicRpc.waitForTransactionReceipt({ hash });
            lastReceiptErr = null;
            break;
          } catch (waitErr) {
            lastReceiptErr = waitErr;
            if (attempt === 0 && isMagicRateLimitError(waitErr)) {
              await new Promise((r) => setTimeout(r, MAGIC_RATE_LIMIT_RETRY_MS));
              continue;
            }
            throw waitErr;
          }
        }
        if (lastReceiptErr != null) throw lastReceiptErr;

        setStatus("waiting-bridge");
        await waitForBridgeCompletion(depositAddress, {
          onStatusChange: () => {
            setStatus((prev) =>
              prev === "waiting-bridge-extended"
                ? "waiting-bridge-extended"
                : "waiting-bridge"
            );
          },
          onExtendedWait: () => {
            setIsExtendedWait(true);
            setStatus("waiting-bridge-extended");
          },
        });
        setStatus("completed");
      } catch (err) {
        const e =
          err instanceof BridgeDepositError || err instanceof BridgeTimeoutError
            ? err
            : err instanceof Error
              ? err
              : new Error(String(err));
        setError(e);
        setStatus("failed");
        throw e;
      } finally {
        setIsConverting(false);
      }
    },
    [eoaAddress, walletClient, publicClient]
  );

  return {
    convertUsdcToUsdce,
    isConverting,
    status,
    error,
    isExtendedWait,
  };
}
