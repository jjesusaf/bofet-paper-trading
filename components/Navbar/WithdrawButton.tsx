"use client";

import { useRef } from "react";
import { Gift } from "lucide-react";
import { useTrading } from "@/providers/TradingProvider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import { useDictionary } from "@/providers/dictionary-provider";
import WithdrawModal from "./WithdrawModal";
import WithdrawDropdown from "./WithdrawDropdown";

/**
 * WithdrawButton - Botón de cobrar saldo disponible
 *
 * Desktop: Muestra dropdown con balance y botón de cobrar
 * Mobile: Muestra solo icono que abre modal h-dvh
 */
export default function WithdrawButton() {
  const { safeAddress } = useTrading();
  const { locale } = useDictionary();
  const modalRef = useRef<HTMLDialogElement>(null);

  const {
    rawUsdcBalance,
  } = usePolygonBalances(safeAddress);

  // No mostrar si no hay saldo
  if (!safeAddress || !rawUsdcBalance || rawUsdcBalance === BigInt(0)) {
    return null;
  }

  const handleMobileClick = () => {
    modalRef.current?.showModal();
  };

  return (
    <>
      {/* Desktop: Dropdown */}
      <WithdrawDropdown />

      {/* Mobile: Icon button that opens modal */}
      <button
        onClick={handleMobileClick}
        className="lg:hidden btn btn-circle bg-[#00C805] hover:bg-[#00A804] text-white border-none btn-sm cursor-pointer"
        aria-label={locale === "es" ? "Cobrar saldo" : "Claim balance"}
      >
        <Gift className="w-4 h-4" />
      </button>

      {/* Modal for mobile */}
      <WithdrawModal ref={modalRef} />
    </>
  );
}
