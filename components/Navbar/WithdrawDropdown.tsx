"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Gift } from "lucide-react";
import { useTrading } from "@/providers/TradingProvider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import { useDictionary } from "@/providers/dictionary-provider";
import WithdrawActionButton from "./WithdrawActionButton";

/**
 * WithdrawDropdown - Dropdown para desktop con Portal
 * Muestra balance y botón de cobrar ENCIMA de todo
 */
export default function WithdrawDropdown() {
  const { safeAddress } = useTrading();
  const { locale } = useDictionary();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  const {
    usdcBalance: safeUsdce,
    isLoading: isLoadingBalances
  } = usePolygonBalances(safeAddress);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // Close on click outside (only if not swapping)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        !isSwapping &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, isSwapping]);

  const handleClose = () => {
    if (!isSwapping) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:inline-flex btn bg-[#00C805] hover:bg-[#00A804] text-white border-none btn-sm gap-1.5 cursor-pointer"
      >
        <Gift className="w-4 h-4" />
        <span className="hidden xl:inline">{locale === "es" ? "Cobrar" : "Claim"}</span>
      </button>

      {isMounted && isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-80 bg-white shadow-xl border border-gray-200 z-9999 rounded-box"
          style={{
            top: `${position.top}px`,
            right: `${position.right}px`,
          }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                {locale === "es" ? "Saldo disponible" : "Available balance"}
              </h3>
              <button
                onClick={handleClose}
                disabled={isSwapping}
                className="btn btn-ghost btn-sm btn-circle"
                title={isSwapping ? (locale === "es" ? "Procesando..." : "Processing...") : (locale === "es" ? "Cerrar" : "Close")}
              >
                ✕
              </button>
            </div>

            {/* Balance Display */}
            <div className="mb-4">
              {isLoadingBalances ? (
                <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-4xl font-bold text-gray-900">
                  ${safeUsdce?.toFixed(2)}
                </p>
              )}
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              {locale === "es"
                ? "Este saldo se cobra automáticamente cuando vendes. Cóbralo manualmente aquí o se sumará a tu próxima venta."
                : "This balance is automatically claimed when you sell. Claim it manually here or it will be added to your next sale."}
            </p>

            {/* Action Button */}
            <WithdrawActionButton
              onSuccess={() => setIsOpen(false)}
              onSwappingChange={setIsSwapping}
            />

            {/* Warning when swapping */}
            {isSwapping && (
              <p className="text-xs text-orange-600 mt-3 text-center">
                {locale === "es" ? "Por favor espera..." : "Please wait..."}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
