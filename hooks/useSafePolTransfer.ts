"use client";

/**
 * Hook for transferring POL from Safe to EOA (for development/testing)
 */

import { useState, useCallback } from "react";
import { useTrading } from "@/providers/TradingProvider";
import { useWallet } from "@/providers/WalletContext";
import Safe from "@safe-global/protocol-kit";
import { MetaTransactionData, OperationType, SigningMethod } from "@safe-global/types-kit";
import { parseUnits, formatUnits } from "viem";
import { getPublicPolygonClient } from "@/utils/polygonGas";
import getMagic from "@/lib/magic";
import { POLYGON_RPC_URL } from "@/constants/api";
import { HOOKS_ZERO } from "@/constants/fullConversion";

export default function useSafePolTransfer() {
  const { safeAddress } = useTrading();
  const { eoaAddress } = useWallet();

  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Transfer POL from Safe to EOA
   * @param amount Amount in POL (e.g., "0.5" for 0.5 POL)
   */
  const transferPolToEoa = useCallback(
    async (amount: string = "0.5") => {
      if (!safeAddress || !eoaAddress) {
        throw new Error("Safe or EOA address not available");
      }

      setIsTransferring(true);
      setError(null);

      try {
        const publicClient = getPublicPolygonClient();

        // Check current POL balance
        const currentPolBalance = await publicClient.getBalance({
          address: safeAddress as `0x${string}`,
        });

        const amountToTransfer = parseUnits(amount, 18);

        console.log(`[SafePolTransfer] Transferring ${amount} POL from Safe to EOA`);
        console.log(`[SafePolTransfer] Current Safe POL balance: ${formatUnits(currentPolBalance, 18)} POL`);

        if (currentPolBalance < amountToTransfer) {
          throw new Error(`Insufficient POL in Safe. Available: ${formatUnits(currentPolBalance, 18)} POL`);
        }

        // Initialize Safe Protocol Kit
        const magic = typeof window !== "undefined" ? getMagic() : null;
        const provider =
          magic?.rpcProvider != null
            ? (magic.rpcProvider as unknown as {
                request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
              })
            : POLYGON_RPC_URL;

        if (!provider) {
          throw new Error("No provider available for Safe SDK");
        }

        console.log("[SafePolTransfer] Initializing Safe Protocol Kit...");
        const safeProtocolKit = await Safe.init({
          provider: provider as Parameters<typeof Safe.init>[0]["provider"],
          signer: eoaAddress,
          safeAddress,
        });
        console.log("[SafePolTransfer] Safe Protocol Kit initialized ✅");

        // Create transaction to send POL (native token)
        const polTransferTx: MetaTransactionData = {
          to: eoaAddress,
          value: amountToTransfer.toString(),
          data: "0x",
          operation: OperationType.Call,
        };

        console.log("[SafePolTransfer] Creating transaction...");
        let safeTransaction = await safeProtocolKit.createTransaction({
          transactions: [polTransferTx],
          options: {
            safeTxGas: "100000",
            baseGas: "0",
            gasPrice: "0",
            gasToken: HOOKS_ZERO,
            refundReceiver: HOOKS_ZERO,
          },
        });

        console.log("[SafePolTransfer] Signing transaction...");
        safeTransaction = await safeProtocolKit.signTransaction(
          safeTransaction,
          SigningMethod.ETH_SIGN_TYPED_DATA_V4
        );

        console.log("[SafePolTransfer] Executing transaction...");
        const txResponse = await safeProtocolKit.executeTransaction(
          safeTransaction
        );

        console.log(`[SafePolTransfer] Transaction sent: ${txResponse.hash}`);

        // Wait for confirmation
        if (
          txResponse.transactionResponse &&
          typeof txResponse.transactionResponse === "object" &&
          "wait" in txResponse.transactionResponse &&
          typeof (txResponse.transactionResponse as any).wait === "function"
        ) {
          await (
            txResponse.transactionResponse as { wait: () => Promise<unknown> }
          ).wait();
          console.log("[SafePolTransfer] Transaction confirmed ✅");
        }

        // Check final balance
        const finalPolBalance = await publicClient.getBalance({
          address: safeAddress as `0x${string}`,
        });

        console.log(`[SafePolTransfer] Final Safe POL balance: ${formatUnits(finalPolBalance, 18)} POL`);
        console.log(`[SafePolTransfer] ✅ Successfully transferred ${amount} POL to EOA`);

        return {
          success: true,
          txHash: txResponse.hash,
          finalBalance: finalPolBalance,
        };
      } catch (err) {
        console.error("[SafePolTransfer] Error:", err);
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setIsTransferring(false);
      }
    },
    [safeAddress, eoaAddress]
  );

  return {
    transferPolToEoa,
    isTransferring,
    error,
  };
}
