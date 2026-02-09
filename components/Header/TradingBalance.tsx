"use client";

/**
 * ✅ EDITABLE - Custom component for displaying balance and action buttons
 * 
 * This component is fully editable:
 * - Balance display text and styling
 * - Deposit and Send button layout, styling, and text
 * - Flex properties and spacing can be adjusted to fix truncation issues
 * - All responsive breakpoints are customizable
 */

import { useState } from "react";
import { ArrowDownToLine, ArrowUpToLine } from "lucide-react";
import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";
import { useDictionary } from "@/providers/dictionary-provider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import { usePaymentModal } from "@/providers/PaymentModalContext";
import PayoutModal from "@/components/PayoutModal";
import TransferModal from "@/components/PolygonAssets/TransferModal";

export default function TradingBalance() {
  const { openPaymentModal } = usePaymentModal();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const { eoaAddress } = useWallet();
  const { isTradingSessionComplete, safeAddress } = useTrading();
  const { dict } = useDictionary();
  const { formattedNativeUsdcBalance, isLoading } = usePolygonBalances(
    eoaAddress
  );

  if (!eoaAddress) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
        {isLoading ? (
          <span className="text-sm text-gray-400">{dict.login?.loading ?? "Loading..."}</span>
        ) : (
          <>
            {/* Balance Display - Native USDC only (USDC.e intentionally hidden) */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-900">
                ${formattedNativeUsdcBalance}
              </span>
            </div>
            {/* Combined Payment/Payout Button - Responsive */}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
              {/* Payment Button - Left Section */}
              <button
                onClick={() => {
                  if (typeof window !== "undefined" && (window as any).datafast) {
                    (window as any).datafast("deposit_modal_triggered");
                  }
                  openPaymentModal();
                }}
                title={dict.navbar?.payment ?? "Payment"}
                className="flex-shrink-0 p-1.5 sm:px-2 sm:py-1.5 md:px-3 md:py-1.5 text-xs font-medium hover:bg-gray-200 text-gray-900 transition-all duration-200 flex items-center gap-1 md:gap-1.5 border-r border-gray-300"
              >
                <ArrowDownToLine className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.navbar?.payment ?? "Payment"}</span>
              </button>
              
              {/* Payout Button - Right Section */}
              <button
                onClick={() => setIsPayoutModalOpen(true)}
                title={dict.navbar?.payout ?? "Payout"}
                className="flex-shrink-0 p-1.5 sm:px-2 sm:py-1.5 md:px-3 md:py-1.5 text-xs font-medium hover:bg-gray-200 text-gray-900 transition-all duration-200 flex items-center gap-1 md:gap-1.5"
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
