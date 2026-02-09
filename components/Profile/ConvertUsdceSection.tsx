"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTrading } from "@/providers/TradingProvider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import useUsdceToUsdcSwap from "@/hooks/useUsdceToUsdcSwap";
import { useDictionary } from "@/providers/dictionary-provider";
import { Info } from "lucide-react";

export default function ConvertUsdceSection() {
  const { safeAddress } = useTrading();
  const { locale } = useDictionary();
  const queryClient = useQueryClient();

  const { usdcBalance: safeUsdce, rawUsdcBalance, isLoading: isLoadingBalances } = usePolygonBalances(safeAddress);
  const { executeSwap, isSwapping, step: swapStep, error: swapError } = useUsdceToUsdcSwap();

  const handleClaim = async () => {
    if (!rawUsdcBalance || rawUsdcBalance === BigInt(0)) {
      return;
    }

    try {
      await executeSwap(rawUsdcBalance);
      queryClient.invalidateQueries({ queryKey: ["usdcBalance", safeAddress] });
      queryClient.invalidateQueries({ queryKey: ["nativeUsdcBalance", safeAddress] });
    } catch (err) {
      console.error("Failed to claim balance:", err);
    }
  };

  // No mostrar si no hay saldo o si ya se completó
  if (!safeAddress || !rawUsdcBalance || rawUsdcBalance === BigInt(0) || swapStep === "completed") {
    return null;
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs text-gray-500">
              {locale === "es" ? "Saldo disponible de operaciones anteriores" : "Available balance from previous trades"}
            </p>
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-xs">
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div
                tabIndex={0}
                className="dropdown-content z-10 card card-compact w-72 sm:w-64 p-3 shadow-lg bg-white border border-gray-200 mt-1"
              >
                <p className="text-xs text-gray-600 leading-relaxed">
                  {locale === "es"
                    ? "Este saldo se cobra automáticamente cuando vendes. Cóbralo manualmente aquí o se sumará a tu próxima venta."
                    : "This balance is automatically claimed when you sell. Claim it manually here or it will be added to your next sale."}
                </p>
              </div>
            </div>
          </div>
          {isLoadingBalances ? (
            <div className="h-6 w-20 bg-gray-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              ${safeUsdce?.toFixed(2)}
            </p>
          )}
        </div>

        <button
          onClick={handleClaim}
          disabled={isSwapping || isLoadingBalances}
          className="px-4 py-2 text-sm font-medium text-white bg-[#00C805] hover:bg-[#00A804] disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
        >
          {isSwapping ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              {locale === "es" ? "Cobrando..." : "Claiming..."}
            </>
          ) : (
            locale === "es" ? "Cobrar" : "Claim"
          )}
        </button>
      </div>

      {/* Error message */}
      {swapError && (
        <p className="text-xs text-red-600 mt-2">
          {locale === "es" ? "Error al cobrar. Intenta de nuevo." : "Error claiming. Try again."}
        </p>
      )}
    </div>
  );
}
