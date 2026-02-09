"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTrading } from "@/providers/TradingProvider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import useUsdceToUsdcSwap from "@/hooks/useUsdceToUsdcSwap";
import { useDictionary } from "@/providers/dictionary-provider";

interface WithdrawActionButtonProps {
  onSuccess?: () => void;
  onSwappingChange?: (isSwapping: boolean) => void;
}

/**
 * WithdrawActionButton - Botón de acción para cobrar
 * Componente compartido entre dropdown y modal
 */
export default function WithdrawActionButton({ onSuccess, onSwappingChange }: WithdrawActionButtonProps) {
  const { safeAddress } = useTrading();
  const { locale } = useDictionary();
  const queryClient = useQueryClient();
  const { rawUsdcBalance } = usePolygonBalances(safeAddress);
  const { executeSwap, isSwapping, error: swapError } = useUsdceToUsdcSwap();

  const handleClaim = async () => {
    if (!rawUsdcBalance || rawUsdcBalance === BigInt(0)) {
      return;
    }

    try {
      onSwappingChange?.(true);
      await executeSwap(rawUsdcBalance);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["usdcBalance", safeAddress] });
      queryClient.invalidateQueries({ queryKey: ["nativeUsdcBalance", safeAddress] });

      onSwappingChange?.(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to claim balance:", err);
      onSwappingChange?.(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={isSwapping}
        className="btn bg-[#00C805] hover:bg-[#00A804] text-white border-none w-full cursor-pointer"
      >
        {isSwapping ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            {locale === "es" ? "Cobrando..." : "Claiming..."}
          </>
        ) : (
          locale === "es" ? "Cobrar ahora" : "Claim now"
        )}
      </button>

      {swapError && (
        <p className="text-xs text-red-600 mt-2">
          {locale === "es" ? "Error al cobrar. Intenta de nuevo." : "Error claiming. Try again."}
        </p>
      )}
    </div>
  );
}
