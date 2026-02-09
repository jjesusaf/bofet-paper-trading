"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import Portal from "@/components/Portal";
import OnrampQuestionnaireForm from "@/components/OnrampQuestionnaireForm";
import { useDictionary } from "@/providers/dictionary-provider";
import useExchangeRates from "@/hooks/useExchangeRates";
import config from "@/config";
import {
  buildUnlimitUrl,
  toUsdAmount,
  MIN_USD_AMOUNT,
  applyExchangeSpread,
  type OnrampFormValues,
} from "@/utils/onrampUrl";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  safeAddress?: string | null;
};

export default function PaymentModal({
  isOpen,
  onClose,
  safeAddress,
}: PaymentModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { dict, locale } = useDictionary();
  const { rates: apiRates } = useExchangeRates();
  const baseRates = apiRates ?? config.exchangeRates;
  const exchangeRates = baseRates
    ? applyExchangeSpread(baseRates, "deposit")
    : undefined;

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

  const handleSubmit = (form: OnrampFormValues) => {
    const amountNum = parseFloat(form.amount);
    const cryptoAmountUsd = toUsdAmount(
      form.currency,
      amountNum,
      exchangeRates
    );
    if (cryptoAmountUsd < MIN_USD_AMOUNT) {
      return; // Form should validate; fallback
    }
    const wallet = safeAddress ?? "";
    if (!wallet) {
      console.warn("No wallet address for Unlimit redirect.");
      return;
    }
    const url = buildUnlimitUrl({
      baseUrl: config.deposit,
      wallet,
      fiatAmount: amountNum,
      fiatCurrency: form.currency,
      method: form.method,
      lang: locale,
      fiatCurrencyLock: false,
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

  const labels = {
    currency: dict.payment?.currency ?? "Currency",
    amount: dict.payment?.amount ?? "Amount",
    method: dict.payment?.method ?? "Method",
    amountPlaceholder: dict.payment?.amountPlaceholder ?? "0",
    amountMinHint: dict.payment?.amountMinHint,
    submit: dict.payment?.submit ?? "Continue",
    amountInvalid: dict.payment?.amountInvalid ?? "Please enter a valid amount.",
    amountBelowMin: dict.payment?.amountBelowMin,
    methodRequired: dict.payment?.methodRequired,
    methods: dict.payment?.methods,
    equivalentUsd: dict.payment?.equivalentUsd,
    estimateReceive: dict.payment?.estimateReceive,
    amountBelowMinUsd: dict.payment?.amountBelowMinUsd,
  };

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="payment-modal"
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
                  {dict.navbar?.payment ?? dict.payment?.title ?? "Payment"}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <OnrampQuestionnaireForm
                labels={labels}
                onSubmit={handleSubmit}
                exchangeRates={exchangeRates}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
