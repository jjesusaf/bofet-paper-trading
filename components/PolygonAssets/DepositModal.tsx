"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import useSafeDeployment from "@/hooks/useSafeDeployment";
import { useWallet } from "@/providers/WalletContext";
import { useDictionary } from "@/providers/dictionary-provider";
import Portal from "@/components/Portal";
import config from "@/config";

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function DepositModal({ isOpen, onClose }: DepositModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { eoaAddress } = useWallet();
  const { derivedSafeAddressFromEoa } = useSafeDeployment(eoaAddress);
  const { dict } = useDictionary();

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

  // Open Onramper when modal opens
  useEffect(() => {
    if (isOpen && derivedSafeAddressFromEoa) {
      const walletsParam = `&wallets=polygon:${derivedSafeAddressFromEoa}`;
      const onramperUrl = `${config.deposit}${walletsParam}`;
      
      // Open Onramper in new window
      const newWindow = window.open(onramperUrl, "_blank", "noopener,noreferrer");
      
      // Handle popup blocker
      if (!newWindow) {
        console.warn("Popup blocked. Please allow popups for this site.");
      }
    }
  }, [isOpen, derivedSafeAddressFromEoa]);

  if (!isOpen || !derivedSafeAddressFromEoa) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const redirectMessage = dict.deposit?.redirecting ?? "We're redirecting you, don't close this screen, wait for the transaction to complete";
  const depositTitle = dict.navbar?.deposit ?? dict.portfolio?.deposit ?? "Deposit";
  const infoNote = dict.deposit?.infoNote ?? "A new window will open for you to complete your purchase. Please complete the transaction in that window.";

  return (
    <Portal>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div
          ref={modalRef}
          className="bg-white rounded-lg p-6 max-w-md w-full border border-gray-300 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              {depositTitle}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Redirect Message */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-600 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            </div>
            <p className="text-center text-gray-700 text-sm leading-relaxed px-4">
              {redirectMessage}
            </p>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-300 rounded-lg">
            <p className="text-xs text-blue-800 text-center">
              {infoNote}
            </p>
          </div>
        </div>
      </div>
    </Portal>
  );
}
