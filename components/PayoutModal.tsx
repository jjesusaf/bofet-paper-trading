"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import Portal from "@/components/Portal";
import PayoutQuestionnaireForm from "@/components/PayoutQuestionnaireForm";
import { useDictionary } from "@/providers/dictionary-provider";
import config from "@/config";
import { buildUnlimitUrl, MIN_USD_AMOUNT } from "@/utils/onrampUrl";

type PayoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  /** Wallet address for offramp (e.g. Safe or EOA). */
  wallet?: string | null;
};

export default function PayoutModal({
  isOpen,
  onClose,
  wallet,
}: PayoutModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { dict, locale } = useDictionary();

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

  const handleSubmit = (form: {
    amountUsd: string;
    currencyPreference: string;
    method: string;
  }) => {
    const cryptoAmountUsd = parseFloat(form.amountUsd);
    if (cryptoAmountUsd < MIN_USD_AMOUNT) return;
    const walletAddress = wallet ?? "";
    if (!walletAddress) {
      console.warn("No wallet address for Unlimit offramp redirect.");
      return;
    }
    const url = buildUnlimitUrl({
      baseUrl: config.receive,
      wallet: walletAddress,
      cryptoAmountUsd,
      method: form.method,
      lang: locale,
      fiatCurrency: form.currencyPreference,
      fiatCurrencyLock: true,
    });
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (!newWindow) {
      console.warn("Popup blocked. Please allow popups for this site.");
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const p = dict.payout as Record<string, unknown> | undefined;
  const labels = {
    takeMoneyOut: (p?.takeMoneyOut as string) ?? "Take money out",
    amountUsd: (p?.amountUsd as string) ?? "How much to withdraw (USD)",
    amountUsdPlaceholder: (p?.amountUsdPlaceholder as string) ?? "0",
    currencyPreference: (p?.currencyPreference as string) ?? "Currency preference",
    method: (p?.method as string) ?? "Take out method",
    noticeExchangeRate:
      (p?.noticeExchangeRate as string) ??
      "Exchange rate calculated at transaction.",
    submit: (p?.submit as string) ?? "Continue",
    amountInvalid: (p?.amountInvalid as string) ?? "Please enter a valid amount.",
    amountBelowMin: (p?.amountBelowMin as string) ?? "Minimum is $13 USD.",
    methodRequired: (p?.methodRequired as string) ?? "Please select a payment method.",
    methods: p?.methods as Record<string, string> | undefined,
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="payout-modal"
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              className="absolute inset-0 bg-black/25 pointer-events-none"
              aria-hidden
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{
                opacity: 1,
                backdropFilter: "blur(6px)",
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              exit={{
                opacity: 0,
                backdropFilter: "blur(0px)",
                transition: { duration: 0.12, ease: "easeIn" },
              }}
              style={{ WebkitBackdropFilter: "blur(6px)" }}
            />
            <motion.div
              ref={modalRef}
              className="relative bg-white rounded-lg p-6 max-w-md w-full border border-gray-300 shadow-2xl"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { duration: 0.15, ease: "easeOut" },
              }}
              exit={{ opacity: 0, transition: { duration: 0.12, ease: "easeIn" } }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {dict.navbar?.payout ?? dict.payout?.title ?? "Payout"}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <PayoutQuestionnaireForm labels={labels} onSubmit={handleSubmit} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
