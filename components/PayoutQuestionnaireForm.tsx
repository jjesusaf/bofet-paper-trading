"use client";

import { useState, FormEvent } from "react";
import { MIN_USD_AMOUNT } from "@/utils/onrampUrl";

export const CURRENCY_PREFERENCE_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "MXN", label: "MXN" },
  { value: "EUR", label: "EUR" },
] as const;

/** Methods per currency: USD and EUR = Apple Pay, Swift; MXN = Apple Pay, SPEI */
const METHODS_BY_CURRENCY: Record<
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
};

export type PayoutFormValues = {
  amountUsd: string;
  currencyPreference: string;
  method: string;
};

export type PayoutQuestionnaireFormLabels = {
  takeMoneyOut: string;
  amountUsd: string;
  amountUsdPlaceholder: string;
  currencyPreference: string;
  method: string;
  noticeExchangeRate: string;
  submit: string;
  amountInvalid: string;
  amountBelowMin: string;
  methodRequired: string;
  methods?: Record<string, string>;
};

type PayoutQuestionnaireFormProps = {
  labels: PayoutQuestionnaireFormLabels;
  onSubmit: (form: PayoutFormValues) => void;
};

export default function PayoutQuestionnaireForm({
  labels,
  onSubmit,
}: PayoutQuestionnaireFormProps) {
  const [amountUsd, setAmountUsd] = useState("");
  const [currencyPreference, setCurrencyPreference] = useState("USD");
  const [method, setMethod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const methodOptions =
    METHODS_BY_CURRENCY[currencyPreference] ?? METHODS_BY_CURRENCY.USD;

  const setCurrencyAndClearMethod = (c: string) => {
    setCurrencyPreference(c);
    setMethod(null);
  };

  const getMethodLabel = (labelKey: string) =>
    labels.methods?.[labelKey] ??
    { applePay: "Apple Pay", swift: "Swift", spei: "SPEI" }[labelKey] ??
    labelKey;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = parseFloat(amountUsd);
    if (!amountUsd.trim() || isNaN(num) || num <= 0) {
      setError(labels.amountInvalid);
      return;
    }
    if (num < MIN_USD_AMOUNT) {
      setError(labels.amountBelowMin ?? `Minimum is $${MIN_USD_AMOUNT} USD.`);
      return;
    }
    if (!method) {
      setError(labels.methodRequired ?? "Please select a payment method.");
      return;
    }
    onSubmit({
      amountUsd: amountUsd.trim(),
      currencyPreference,
      method,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {labels.takeMoneyOut}
        </label>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 text-gray-700">
          <span className="text-sm font-medium">USD</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {labels.amountUsd}
        </label>
        <p className="text-xs text-gray-500 mb-1">
          Min: ${MIN_USD_AMOUNT} USD
        </p>
        <input
          type="number"
          min={MIN_USD_AMOUNT}
          step="1"
          value={amountUsd}
          onChange={(e) => setAmountUsd(e.target.value)}
          placeholder={labels.amountUsdPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {labels.currencyPreference}
        </label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={labels.currencyPreference}
        >
          {CURRENCY_PREFERENCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCurrencyAndClearMethod(opt.value)}
              className={`flex-1 min-w-[80px] px-4 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                currencyPreference === opt.value
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {labels.method}
        </label>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={labels.method}
        >
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

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">{labels.noticeExchangeRate}</p>
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
