"use client";

import { useState } from "react";
import { ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";
import { useDictionary } from "@/providers/dictionary-provider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import useUserPositions from "@/hooks/useUserPositions";
import { usePaymentModal } from "@/providers/PaymentModalContext";
import PayoutModal from "@/components/PayoutModal";
import TransferModal from "@/components/PolygonAssets/TransferModal";
import WithdrawButton from "@/components/Navbar/WithdrawButton";

const CURRENCIES = [
  { code: "USD", label: "USD 🇺🇸" },
  // { code: "MXN", label: "MXN 🇲🇽" },
  // { code: "EUR", label: "EUR 🇪🇺" },
] as const;

type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export default function PortfolioCashBalance() {
  const { openPaymentModal } = usePaymentModal();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const { eoaAddress } = useWallet();
  const { safeAddress } = useTrading();
  const { dict } = useDictionary();

  // Get EOA balances
  const {
    usdcBalance: eoaUsdce,
    nativeUsdcBalance: eoaNativeUsdc,
    isLoading: isLoadingEoa
  } = usePolygonBalances(eoaAddress);

  // Get Safe balances
  const {
    usdcBalance: safeUsdce,
    nativeUsdcBalance: safeNativeUsdc,
    isLoading: isLoadingSafe
  } = usePolygonBalances(safeAddress);

  // Get user positions
  const { data: positions, isLoading: isLoadingPositions } = useUserPositions(safeAddress);

  if (!eoaAddress) {
    return null;
  }

  const isLoading = isLoadingEoa || isLoadingSafe || isLoadingPositions;

  // Calculate total EOA balance (USDC + USDC.e)
  const totalEoaBalance = (eoaUsdce || 0) + (eoaNativeUsdc || 0);

  // Calculate total Safe balance (USDC + USDC.e)
  const totalSafeBalance = (safeUsdce || 0) + (safeNativeUsdc || 0);

  // Calculate total positions value
  const totalPositionsValue = positions?.reduce((sum, position) => sum + position.currentValue, 0) || 0;

  // Portfolio = EOA balance + Safe balance + positions value
  const portfolio = totalEoaBalance + totalSafeBalance + totalPositionsValue;

  // Balance = Only Safe balance (USDC + USDC.e from Safe)
  const balance = totalSafeBalance;

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">


        {isLoading ? (
          <span className="text-sm text-gray-400">{dict.login?.loading ?? "Loading..."}</span>
        ) : (
          <>
            {/* Withdraw/Claim Button - Next to Balance */}
            <WithdrawButton />
            
            {/* Balance Display (USDC + USDC.e from Safe only) */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">
                Balance
              </span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                ${balance.toFixed(2)}
              </span>
            </div>

            {/* Available to Invest Display (only USDC from Safe) */}
            <div className="flex flex-col items-end">
              <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">
                Disponible
              </span>
              <span className="text-sm sm:text-base font-semibold text-green-600">
                ${(safeNativeUsdc || 0).toFixed(2)}
              </span>
            </div>



            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="select select-bordered select-sm text-[10px] sm:text-xs h-7 min-h-7 py-0 pl-1 pr-4 w-fit min-w-0 shrink bg-gray-50 border-gray-300 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400"
              aria-label="Currency"
            >
              {CURRENCIES.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>

            {/* Cash Display - commented out
            <div className="flex flex-col items-end">
              <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">
                Cash
              </span>
              <span className="text-sm sm:text-base font-semibold text-gray-900">
                ${cash.toFixed(2)}
              </span>
            </div>
            */}

            {/* Combined Payment/Payout Button - Responsive */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
              {/* Payment Button - Left Section */}
              <button
                onClick={() => {
                  openPaymentModal();
                }}
                title={dict.navbar?.payment ?? "Payment"}
                className="flex-shrink-0 p-1.5 sm:px-2 sm:py-1.5 md:px-3 md:py-1.5 text-xs font-medium hover:bg-gray-200 text-gray-900 transition-all duration-200 flex items-center gap-1 md:gap-1.5 border-r border-gray-300 cursor-pointer"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.navbar?.payment ?? "Payment"}</span>
              </button>

              {/* Payout Button - Right Section */}
              <button
                onClick={() => setIsPayoutModalOpen(true)}
                title={dict.navbar?.payout ?? "Payout"}
                className="flex-shrink-0 p-1.5 sm:px-2 sm:py-1.5 md:px-3 md:py-1.5 text-xs font-medium hover:bg-gray-200 text-gray-900 transition-all duration-200 flex items-center gap-1 md:gap-1.5 cursor-pointer"
              >
                <ArrowUpToLine className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{dict.navbar?.payout ?? "Payout"}</span>
              </button>
            </div>
          </>
        )}
      </div>

      <PayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        wallet={safeAddress}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </>
  );
}
