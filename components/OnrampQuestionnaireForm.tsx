"use client";

import { useState, FormEvent } from "react";
import {
  type OnrampFormValues,
  type ExchangeRates,
  toUsdAmount,
  minAmountInCurrency,
  MIN_USD_AMOUNT,
  EXCHANGE_SPREAD_DEPOSIT,
} from "@/utils/onrampUrl";

export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "MXN", label: "MXN" },
  { value: "EUR", label: "EUR" },
] as const;

/** Methods per currency: USD and EUR = Apple Pay, Swift; MXN = Apple Pay, SPEI */
export const METHODS_BY_CURRENCY: Record<
  string,
  readonly { value: string; labelKey: string }[]
> = {
  USD: [
    { value: "applepay", labelKey: "applePay" },
    { value: "swift", labelKey: "swift" },
  ],
  MXN: [
    { value: "applepay", labelKey: "applePay" },
    { value: "spei", labelKey: "spei" },
  ],
  EUR: [
    { value: "applepay", labelKey: "applePay" },
    { value: "swift", labelKey: "swift" },
  ],
} as const;

export type OnrampQuestionnaireFormLabels = {
  currency: string;
  amount: string;
  method: string;
  amountPlaceholder: string;
  amountMinHint?: string;
  submit: string;
  amountInvalid: string;
  amountBelowMin?: string;
  methodRequired?: string;
  /** Method labels: applePay, swift, spei */
  methods?: Record<string, string>;
  /** Shown when currency is MXN/EUR: "≈ $X USD (USDC)". Use {{amount}} for the number. */
  equivalentUsd?: string;
  /** Estimate of USD (USDC) to receive. Use {{amount}} for the number. Shown for all currencies when amount is valid. */
  estimateReceive?: string;
  /** Shown when converted amount is below min USD (e.g. $15). */
  amountBelowMinUsd?: string;
};

type OnrampQuestionnaireFormProps = {
  labels: OnrampQuestionnaireFormLabels;
  onSubmit: (form: OnrampFormValues) => void;
  /** Exchange rates for MXN/EUR -> USD conversion display and validation. */
  exchangeRates?: ExchangeRates | null;
};

export default function OnrampQuestionnaireForm({
  labels,
  onSubmit,
  exchangeRates,
}: OnrampQuestionnaireFormProps) {
  const [currency, setCurrency] = useState("USD");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const methodOptions = METHODS_BY_CURRENCY[currency] ?? METHODS_BY_CURRENCY.USD;

  const setCurrencyAndClearMethod = (c: string) => {
    setCurrency(c);
    setMethod(null);
  };

  // Minimum in selected currency that equals $13 USD (uses live rates when available).
  const minAmount = minAmountInCurrency(currency, exchangeRates);
  const minDisplay =
    currency === "USD"
      ? "$13"
      : currency === "EUR"
        ? `€${minAmount}`
        : String(minAmount);
  const minHint = labels.amountMinHint
    ?.replace("{{min}}", minDisplay)
    ?.replace("{{currency}}", currency) ?? `Min: ${minDisplay} ${currency}`;

  const amountNum = amount.trim() ? parseFloat(amount) : NaN;
  const isValidAmount = !isNaN(amountNum) && amountNum > 0;
  const usdAmount =
    currency !== "USD" && isValidAmount
      ? toUsdAmount(currency, amountNum, exchangeRates ?? undefined)
      : amountNum;
  // Estimate after 4.7% spread: for USD apply here; for MXN/EUR spread is already in exchangeRates
  const estimatedReceiveUsd =
    currency === "USD" && isValidAmount && usdAmount > 0
      ? usdAmount * (1 - EXCHANGE_SPREAD_DEPOSIT)
      : usdAmount;
  const showEquivalentUsd =
    currency !== "USD" && isValidAmount && usdAmount > 0;
  const equivalentUsdText = labels.equivalentUsd
    ?.replace("{{amount}}", usdAmount.toFixed(2))
    ?? `≈ $${usdAmount.toFixed(2)} USD`;
  const showEstimateReceive = isValidAmount && usdAmount > 0;
  const estimateReceiveText = labels.estimateReceive
    ?.replace("{{amount}}", estimatedReceiveUsd.toFixed(2))
    ?? `You will receive approximately $${estimatedReceiveUsd.toFixed(2)} USD.`;

  const getMethodLabel = (labelKey: string) =>
    labels.methods?.[labelKey] ?? { applePay: "Apple Pay", swift: "Swift", spei: "SPEI" }[labelKey] ?? labelKey;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = parseFloat(amount);
    if (!amount.trim() || isNaN(num) || num <= 0) {
      setError(labels.amountInvalid);
      return;
    }
    if (num < minAmount) {
      setError(labels.amountBelowMin ?? `Minimum amount is ${minHint}`);
      return;
    }
    const usd = toUsdAmount(currency, num, exchangeRates ?? undefined);
    if (usd < MIN_USD_AMOUNT) {
      setError(
        labels.amountBelowMinUsd ??
          `Minimum is $${MIN_USD_AMOUNT} USD equivalent.`
      );
      return;
    }
    if (!method) {
      setError(labels.methodRequired ?? "Please select a payment method.");
      return;
    }
    onSubmit({ currency, amount: amount.trim(), method });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {labels.currency}
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.currency}>
          {CURRENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCurrencyAndClearMethod(opt.value)}
              className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                currency === opt.value
                  ? "border-[#00C805] bg-[#00C805]/10 text-[#00C805]"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {labels.amount}
        </label>
        <p className="text-xs text-gray-500 mb-1">{minHint}</p>
        <input
          type="number"
          min={minAmount}
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={labels.amountPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
        {showEquivalentUsd && (
          <p className="text-xs text-gray-600 mt-1.5">{equivalentUsdText}</p>
        )}
        {showEstimateReceive && (
          <p className="text-sm font-medium text-gray-800 mt-2 px-2 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            {estimateReceiveText}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {labels.method}
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.method}>
          {methodOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMethod(opt.value)}
              className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                method === opt.value
                  ? "border-[#00C805] bg-[#00C805]/10 text-[#00C805]"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              {getMethodLabel(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="w-full bg-[#00C805] hover:bg-[#00A804] text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {labels.submit}
      </button>
    </form>
  );
}
