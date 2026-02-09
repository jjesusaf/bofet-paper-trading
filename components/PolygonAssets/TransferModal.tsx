"use client";

import { useState, useEffect, useRef } from "react";
import useUsdcTransfer, { TransferToken } from "@/hooks/useUsdcTransfer";
import { useTrading } from "@/providers/TradingProvider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import { useDictionary } from "@/providers/dictionary-provider";

import Portal from "@/components/Portal";

import { USDC_DECIMALS, USDC_E_DECIMALS } from "@/constants/tokens";
import { parseUnits } from "viem";

type TransferModalProps = {
  isOpen: boolean;
  onClose: () => void;
  allowTokenSelect?: boolean;
};

export default function TransferModal({
  isOpen,
  onClose,
  allowTokenSelect = false,
}: TransferModalProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [token, setToken] = useState<TransferToken>("USDC.e");

  const modalRef = useRef<HTMLDivElement>(null);
  const { relayClient, safeAddress, initializeRelayClient } = useTrading();
  const { isTransferring, error, transferUsdc } = useUsdcTransfer();
  const {
    formattedUsdcBalance,
    rawUsdcBalance,
    formattedNativeUsdcBalance,
    rawNativeUsdcBalance,
  } = usePolygonBalances(safeAddress);
  const { dict } = useDictionary();

  useEffect(() => {
    if (isOpen) {
      setRecipient("");
      setAmount("");
      setShowSuccess(false);
      setToken("USDC.e");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
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

  const selectedDecimals = token === "USDC" ? USDC_DECIMALS : USDC_E_DECIMALS;
  const selectedFormattedBalance =
    token === "USDC" ? formattedNativeUsdcBalance : formattedUsdcBalance;
  const selectedRawBalance =
    token === "USDC" ? rawNativeUsdcBalance : rawUsdcBalance;

  const handleTransfer = async () => {
    if (!relayClient || !recipient || !amount) return;

    try {
      const amountBigInt = parseUnits(amount, selectedDecimals);
      await transferUsdc(
        relayClient,
        {
          recipient: recipient as `0x${string}`,
          amount: amountBigInt,
          token,
        },
        initializeRelayClient
      );
      setShowSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("Transfer failed:", err);
    }
  };

  const handleSendMax = () => {
    if (selectedRawBalance) {
      setAmount((Number(selectedRawBalance) / 10 ** selectedDecimals).toString());
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-modal-fade-in"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {dict.transfer?.title ?? `Enviar ${token}`}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Transfiere fondos a otra dirección
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-sm btn-circle btn-ghost"
            >
              ✕
            </button>
          </div>

          {/* Success Alert */}
          {showSuccess && (
            <div role="alert" className="alert alert-success mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{dict.transfer?.success ?? "¡Transferencia exitosa!"}</span>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div role="alert" className="alert alert-error mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">{error.message}</span>
            </div>
          )}

          {/* Balance Display */}
          <div className="bg-base-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">
                  {dict.transfer?.availableBalance ?? "Balance Disponible"}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  ${selectedFormattedBalance} <span className="text-base text-gray-500">{token}</span>
                </p>
              </div>

              {allowTokenSelect && (
                <select
                  className="select select-bordered select-sm w-auto"
                  value={token}
                  onChange={(e) => setToken(e.target.value as TransferToken)}
                  disabled={isTransferring}
                >
                  <option value="USDC">USDC</option>
                  <option value="USDC.e">USDC.e</option>
                </select>
              )}
            </div>
          </div>

          {/* Recipient Input */}
          <div className="mb-4">
            <label className="input input-bordered flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={dict.transfer?.recipientPlaceholder ?? "0x..."}
                className="grow font-mono text-sm"
                disabled={isTransferring}
              />
            </label>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                {dict.transfer?.recipientAddress ?? "Dirección del destinatario"}
              </span>
            </label>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="input input-bordered flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path d="M8.5 1A1.5 1.5 0 0 0 7 2.5V3H5.5A1.5 1.5 0 0 0 4 4.5v.793c-.026.009-.051.02-.076.032L7.674 8.51c.206.1.446.1.652 0l3.75-3.185A.5.5 0 0 0 12 4.5v-.5A1.5 1.5 0 0 0 10.5 2.5H9v-.5A1.5 1.5 0 0 0 8.5 1z" />
                <path d="M12.5 4H12v3.379l-1.5 1.276V7.5A1.5 1.5 0 0 0 9 6H7a1.5 1.5 0 0 0-1.5 1.5v1.155L4 7.379V4h-.5A1.5 1.5 0 0 0 2 5.5v9A1.5 1.5 0 0 0 3.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 12.5 4z" />
              </svg>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={dict.transfer?.amountPlaceholder ?? "0.00"}
                className="grow"
                disabled={isTransferring}
              />
              <button
                type="button"
                onClick={handleSendMax}
                className="btn btn-xs btn-primary"
                disabled={isTransferring}
              >
                {dict.transfer?.max ?? "MAX"}
              </button>
            </label>
            <label className="label">
              <span className="label-text-alt text-gray-500">
                {dict.transfer?.amount ?? `Monto en ${token}`}
              </span>
            </label>
          </div>

          {/* Send Button */}
          <button
            onClick={handleTransfer}
            disabled={isTransferring || !recipient || !amount || !relayClient}
            className="btn btn-primary btn-block btn-lg"
          >
            {isTransferring ? (
              <>
                <span className="loading loading-spinner"></span>
                {dict.transfer?.sending ?? "Enviando..."}
              </>
            ) : (
              dict.transfer?.send ?? `Enviar ${token}`
            )}
          </button>

          {!relayClient && (
            <div role="alert" className="alert alert-warning mt-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-xs">
                {dict.transfer?.startSessionFirst ?? "Inicia una sesión de trading primero"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
