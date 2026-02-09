"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import useMarketOrder from "@/hooks/useMarketOrder";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import useTickSize from "@/hooks/useTickSize";
import { useState, useEffect, useRef } from "react";
import { useTrading } from "@/providers/TradingProvider";
import { useDictionary } from "@/providers/dictionary-provider";

import Portal from "@/components/Portal";
import OrderForm from "@/components/Trading/OrderModal/OrderForm";
import OrderSummary from "@/components/Trading/OrderModal/OrderSummary";
import OrderTypeToggle from "@/components/Trading/OrderModal/OrderTypeToggle";
import { usePaymentModal } from "@/providers/PaymentModalContext";

import { MIN_ORDER_SIZE } from "@/constants/validation";
import { isValidSize } from "@/utils/validation";
import { MIN_BRIDGE_DEPOSIT } from "@/constants/api";

function getDecimalPlaces(tickSize: number): number {
  if (tickSize >= 1) return 0;
  const str = tickSize.toString();
  const decimalPart = str.split(".")[1];
  return decimalPart ? decimalPart.length : 0;
}

function isValidTickPrice(price: number, tickSize: number): boolean {
  if (tickSize <= 0) return false;
  const multiplier = Math.round(price / tickSize);
  const expectedPrice = multiplier * tickSize;
  // Allow small floating point tolerance
  return Math.abs(price - expectedPrice) < 1e-10;
}

type OrderPlacementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  marketTitle: string;
  outcome: string;
  currentPrice: number;
  tokenId: string;
  negRisk?: boolean;
};

export default function OrderPlacementModal({
  isOpen,
  onClose,
  marketTitle,
  outcome,
  currentPrice,
  tokenId,
  negRisk = false,
}: OrderPlacementModalProps) {
  const [size, setSize] = useState<string>("");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { clobClient, safeAddress } = useTrading();
  const { openPaymentModal } = usePaymentModal();
  const { dict } = useDictionary();
  const params = useParams();
  const lang = (params?.lang as string) ?? "en";
  const { formattedUsdcBalance, rawUsdcBalance } = usePolygonBalances(safeAddress);
  const hasNoUsdce = (rawUsdcBalance ?? BigInt(0)) === BigInt(0);

  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch tick size dynamically for this market
  const { tickSize, isLoading: isLoadingTickSize } = useTickSize(
    isOpen ? tokenId : null
  );
  const decimalPlaces = getDecimalPlaces(tickSize);

  const {
    executeOrder,
    isExecuting,
    status: marketStatus,
    progressMessage,
    error: marketOrderError,
  } = useMarketOrder();

  useEffect(() => {
    if (isOpen) {
      setSize("");
      setOrderType("market");
      setLimitPrice("");
      setLocalError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);


  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeNum = parseFloat(size) || 0;
  const limitPriceNum = parseFloat(limitPrice) || 0;
  const effectivePrice = orderType === "limit" ? limitPriceNum : currentPrice;

  const handlePlaceOrder = async () => {
    if (!isValidSize(sizeNum)) {
      setLocalError(`Size must be greater than ${MIN_ORDER_SIZE}`);
      return;
    }

    if (orderType === "limit") {
      if (!limitPrice || limitPriceNum <= 0) {
        setLocalError(dict.trading?.orderModal?.limitPriceRequired ?? "Limit price is required");
        return;
      }

      if (limitPriceNum < tickSize || limitPriceNum > 1 - tickSize) {
        const minPrice = tickSize.toFixed(decimalPlaces);
        const maxPrice = (1 - tickSize).toFixed(decimalPlaces);
        const errorMsg = dict.trading?.orderModal?.priceBetween ?? `Price must be between $${minPrice} and $${maxPrice}`;
        setLocalError(errorMsg.replace("{{min}}", minPrice).replace("{{max}}", maxPrice));
        return;
      }

      if (!isValidTickPrice(limitPriceNum, tickSize)) {
        const errorMsg = dict.trading?.orderModal?.priceMultiple ?? `Price must be a multiple of tick size ($${tickSize})`;
        setLocalError(errorMsg.replace("{{tickSize}}", tickSize.toString()));
        return;
      }
    }

    try {
      // Calcular monto en USD según el tipo de orden
      const priceToUse = orderType === "market" ? currentPrice : limitPriceNum;
      const amountUsd = sizeNum * priceToUse;

      // Validación de mínimo para BUY (necesita >= $2 para bridge si no hay USDC.e)
      if (amountUsd < MIN_BRIDGE_DEPOSIT) {
        setLocalError(`La compra debe ser de al menos $${MIN_BRIDGE_DEPOSIT} USD. Monto actual: $${amountUsd.toFixed(2)}`);
        return;
      }

      // executeOrder handles everything automatically:
      // - If enough USDC.e in Safe → execute order directly
      // - If not enough USDC.e → convert USDC to USDC.e from Safe (min 2 USDC required)
      const result = await executeOrder({
        tokenId,
        amount: amountUsd,
        size: sizeNum,
        side: "BUY",
        price: orderType === "limit" ? limitPriceNum : undefined,
        isMarketOrder: orderType === "market",
        negRisk,
      });

      if (result.success && result.orderId) {
        setShowSuccess(true);
        setTimeout(() => onClose(), 2000);
      }
    } catch (err) {
      console.error("Error placing order:", err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="bg-base-100 rounded-lg p-4 max-w-md w-full border border-base-300 shadow-xl animate-modal-fade-in overflow-x-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 mb-4 border-b border-base-300">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1 text-base-content">{marketTitle}</h3>
              {(() => {
                const o = outcome.trim().toLowerCase();
                const isYes = o === "yes" || o === "sí";
                const isNo = o === "no";
                const displayLabel = isYes
                  ? (dict.marketDetail?.tradingModal?.yes ?? "Sí")
                  : isNo
                    ? (dict.marketDetail?.tradingModal?.no ?? "No")
                    : outcome;
                return (
                  <p className={`text-sm font-medium ${isYes ? "text-success" : isNo ? "text-error" : "text-base-content"}`}>
                    Comprando: {displayLabel}
                  </p>
                );
              })()}
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div role="alert" className="alert alert-success mb-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">¡Orden colocada exitosamente!</h3>
                <div className="text-sm opacity-90">Tu orden ha sido procesada correctamente.</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(localError || marketOrderError) && (() => {
            const error = localError ?? marketOrderError;
            const errorMsg = typeof error === 'string' ? error : error?.message ?? '';

            // Detect error type for clearer messages
            const isInsufficientPol = errorMsg.includes('Insufficient POL') || errorMsg.includes('insufficient funds for gas');
            const isInsufficientBalance = errorMsg.includes('INSUFFICIENT_BALANCE') || (marketOrderError && (marketOrderError as Error & { code?: string }).code === "INSUFFICIENT_BALANCE");
            const isRateLimit = errorMsg.includes('Too many requests') || errorMsg.includes('rate limit');

            return (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm">
                    {isInsufficientPol ? 'Necesitas ~0.1 POL en tu wallet para pagar gas'
                    : isInsufficientBalance ? 'Saldo insuficiente'
                    : isRateLimit ? 'Demasiados intentos. Espera 1 minuto'
                    : errorMsg}
                  </span>
                </div>
                {isInsufficientBalance && (
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined" && (window as any).datafast) {
                        (window as any).datafast("deposit_modal_triggered");
                      }
                      onClose();
                      openPaymentModal();
                    }}
                    className="mt-2 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Depositar
                  </button>
                )}
              </div>
            );
          })()}

          {/* Order Type Toggle */}
          <OrderTypeToggle
            orderType={orderType}
            onChangeOrderType={(type) => {
              setOrderType(type);
              setLocalError(null);
            }}
            marketLabel={dict.marketDetail?.tradingModal?.market ?? "Market"}
            limitLabel={dict.marketDetail?.tradingModal?.limit ?? "Limit"}
          />

          {/* Order Form */}
          <OrderForm
            size={size}
            onSizeChange={(value) => {
              setSize(value);
              setLocalError(null);
            }}
            limitPrice={limitPrice}
            onLimitPriceChange={(value) => {
              setLimitPrice(value);
              setLocalError(null);
            }}
            orderType={orderType}
            currentPrice={currentPrice}
            isSubmitting={isExecuting}
            tickSize={tickSize}
            decimalPlaces={decimalPlaces}
            isLoadingTickSize={isLoadingTickSize}
            sharesLabel={dict.marketDetail?.tradingModal?.shares ?? "Shares"}
            limitPriceLabel={dict.marketDetail?.tradingModal?.limitPrice ?? "Limit Price"}
          />

          {/* Order Summary */}
          <OrderSummary
            size={sizeNum}
            price={effectivePrice}
            totalLabel={dict.marketDetail?.tradingModal?.total ?? "Total"}
            youllGetLabel={dict.marketDetail?.tradingModal?.youllGet ?? "You'll get"}
          />

          {/* Available for orders: Safe USDC.e (orders are paid from Safe, not EOA) */}
          {/* {safeAddress && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">
                {dict.trading?.orderModal?.availableForOrders ?? "Available for orders"}: ${formattedUsdcBalance ?? "0.00"} USDC.e
              </p>
              {hasNoUsdce && (
                <p className="text-xs text-amber-600">
                  {dict.trading?.orderModal?.fundSafeToPlaceOrders ?? "Fund your Safe to place orders."}{" "}
                  <Link
                    href={`/${lang}/profile`}
                    onClick={onClose}
                    className="font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    {dict.trading?.orderModal?.fundSafeViaDeposit ?? "Fund your Safe via Deposit"}
                  </Link>
                </p>
              )}
            </div>
          )} */}

          {/* Place Order Button */}
          {(() => {
            const isBusy = isExecuting;
            const disabled = isBusy || sizeNum <= 0 || !clobClient;
            let buttonLabel = dict.trading?.orderModal?.placeOrder ?? "Colocar orden";
            let helpText = "";

            if (isExecuting) {
              if (marketStatus === "checking-balance") {
                buttonLabel = "Verificando...";
              } else if (marketStatus === "placing-order") {
                buttonLabel = "Ejecutando...";
              } else {
                buttonLabel = "Procesando...";
              }
              helpText = progressMessage || "Un momento por favor";
            }
            return (
              <>
                <button
                  onClick={handlePlaceOrder}
                  disabled={disabled}
                  className={`w-full py-3 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${!disabled ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer" : "bg-gray-600 text-white cursor-not-allowed"}`}
                >
                  {isExecuting && <span className="loading loading-spinner loading-sm"></span>}
                  {buttonLabel}
                </button>
                {isExecuting && helpText && (
                  <p className="text-xs text-gray-500 mt-2 text-center animate-pulse">
                    {helpText}
                  </p>
                )}
                {!clobClient && (
                  <p className="text-xs text-yellow-600 mt-2 text-center">
                    {dict.trading?.orderModal?.initializeClobFirst ?? "Inicializa el cliente CLOB primero"}
                  </p>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </Portal>
  );
}
