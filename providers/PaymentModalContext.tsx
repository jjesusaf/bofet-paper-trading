"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useTrading } from "@/providers/TradingProvider";
import PaymentModal from "@/components/PaymentModal";

type PaymentModalContextValue = {
  openPaymentModal: () => void;
};

const PaymentModalContext = createContext<PaymentModalContextValue | null>(
  null
);

export function PaymentModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { safeAddress } = useTrading();

  const openPaymentModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  return (
    <PaymentModalContext.Provider value={{ openPaymentModal }}>
      {children}
      <PaymentModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        safeAddress={safeAddress}
      />
    </PaymentModalContext.Provider>
  );
}

export function usePaymentModal(): PaymentModalContextValue {
  const ctx = useContext(PaymentModalContext);
  if (!ctx) {
    throw new Error("usePaymentModal must be used within PaymentModalProvider");
  }
  return ctx;
}
