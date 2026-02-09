"use client";

import { forwardRef, useState } from "react";
import { useTrading } from "@/providers/TradingProvider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import { useDictionary } from "@/providers/dictionary-provider";
import WithdrawActionButton from "./WithdrawActionButton";

/**
 * WithdrawModal - Modal h-dvh para mobile
 * Muestra balance disponible, explicación y botón de cobrar
 */
const WithdrawModal = forwardRef<HTMLDialogElement>((_, ref) => {
  const { safeAddress } = useTrading();
  const { locale } = useDictionary();
  const [isSwapping, setIsSwapping] = useState(false);

  const {
    usdcBalance: safeUsdce,
    isLoading: isLoadingBalances
  } = usePolygonBalances(safeAddress);

  const handleSuccess = () => {
    if (ref && typeof ref !== 'function' && ref.current) {
      ref.current.close();
    }
  };

  const handleClose = (e: React.FormEvent<HTMLFormElement>) => {
    if (isSwapping) {
      e.preventDefault();
      return;
    }
  };

  return (
    <dialog ref={ref} className="modal">
      <div className="modal-box w-full max-w-full h-dvh sm:h-auto sm:max-w-md p-0 rounded-none sm:rounded-box">
        {/* Close button */}
        <form method="dialog" onSubmit={handleClose}>
          <button
            type="submit"
            disabled={isSwapping}
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 z-10"
            title={isSwapping ? (locale === "es" ? "Procesando..." : "Processing...") : (locale === "es" ? "Cerrar" : "Close")}
          >
            ✕
          </button>
        </form>

        {/* Content */}
        <div className="flex flex-col h-full p-6 pt-12">
          {/* Header */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-8 h-8 text-[#00C805]"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === "es" ? "Saldo disponible" : "Available balance"}
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                {locale === "es"
                  ? "De operaciones anteriores"
                  : "From previous trades"}
              </p>

              {isLoadingBalances ? (
                <div className="h-12 w-32 bg-gray-200 animate-pulse rounded mx-auto mb-6"></div>
              ) : (
                <p className="text-5xl font-bold text-gray-900 mb-6">
                  ${safeUsdce?.toFixed(2)}
                </p>
              )}
            </div>

            {/* Info box */}
            <div className="alert bg-blue-50 border border-blue-200 mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-blue-600 shrink-0 w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="text-sm text-blue-800 leading-relaxed">
                {locale === "es"
                  ? "Este saldo se cobra automáticamente cuando vendes. Cóbralo manualmente aquí o se sumará a tu próxima venta."
                  : "This balance is automatically claimed when you sell. Claim it manually here or it will be added to your next sale."}
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-auto">
            <WithdrawActionButton
              onSuccess={handleSuccess}
              onSwappingChange={setIsSwapping}
            />

            {/* Warning when swapping */}
            {isSwapping && (
              <p className="text-xs text-orange-600 mt-3 text-center">
                {locale === "es" ? "Por favor espera, no cierres esta pantalla..." : "Please wait, don't close this screen..."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop" onSubmit={handleClose}>
        <button type="submit" disabled={isSwapping}>close</button>
      </form>
    </dialog>
  );
});

WithdrawModal.displayName = "WithdrawModal";

export default WithdrawModal;
