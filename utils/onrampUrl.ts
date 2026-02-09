/**
 * Build Unlimit onramp/offramp URLs from base config URL + wallet, USD amount, method, and lang.
 * cryptoCurrency is always USDC_POLYGON (set in config base URL).
 */

export type OnrampFormValues = {
  currency: string;
  amount: string;
  method: string;
};

export type ExchangeRates = {
  MXN_TO_USD?: number;
  EUR_TO_USD?: number;
};

const DEFAULT_RATES: ExchangeRates = {
  MXN_TO_USD: 0.058,
  EUR_TO_USD: 1.08,
};

/**
 * Exchange spread: effective rate = base rate * (1 - spread).
 * - Positive: worse for user (e.g. 0.047 = user gets 4.7% less USD per unit fiat).
 * - Negative: better for user (e.g. -0.05 = user gets 5% more USD per unit fiat).
 */
export const EXCHANGE_SPREAD_DEPOSIT = 0.047;
export const EXCHANGE_SPREAD_PAYOUT = -0.05;

export type ExchangeFlow = "deposit" | "payout";

/** Apply spread to rates: effective rate = base rate * (1 - spread). Supports positive and negative spread. Returns a new object. */
export function applyExchangeSpread(
  rates: ExchangeRates | null | undefined,
  flow: ExchangeFlow
): ExchangeRates | null {
  if (!rates) return null;
  const spread = flow === "deposit" ? EXCHANGE_SPREAD_DEPOSIT : EXCHANGE_SPREAD_PAYOUT;
  const factor = 1 - spread;
  return {
    MXN_TO_USD: rates.MXN_TO_USD != null ? rates.MXN_TO_USD * factor : undefined,
    EUR_TO_USD: rates.EUR_TO_USD != null ? rates.EUR_TO_USD * factor : undefined,
  };
}

/** Convert form amount to USD using currency and optional config rates. */
export function toUsdAmount(
  currency: string,
  amountNum: number,
  rates?: ExchangeRates | null
): number {
  const r = rates ?? DEFAULT_RATES;
  if (currency === "USD") return amountNum;
  if (currency === "MXN" && r.MXN_TO_USD != null) return amountNum * r.MXN_TO_USD;
  if (currency === "EUR" && r.EUR_TO_USD != null) return amountNum * r.EUR_TO_USD;
  return amountNum;
}

/** Minimum USD amount for Unlimit (enforce after conversion). */
export const MIN_USD_AMOUNT = 13;

/** Minimum amount in the given currency that equals MIN_USD_AMOUNT. Used for hint and validation. */
export function minAmountInCurrency(
  currency: string,
  rates?: ExchangeRates | null
): number {
  if (currency === "USD") return MIN_USD_AMOUNT;
  const r = rates ?? DEFAULT_RATES;
  if (currency === "MXN" && r.MXN_TO_USD != null && r.MXN_TO_USD > 0)
    return Math.ceil(MIN_USD_AMOUNT / r.MXN_TO_USD);
  if (currency === "EUR" && r.EUR_TO_USD != null && r.EUR_TO_USD > 0)
    return Math.ceil(MIN_USD_AMOUNT / r.EUR_TO_USD);
  return MIN_USD_AMOUNT;
}

const METHOD_TO_UNLIMIT: Record<string, string> = {
  applepay: "APPLEPAY",
  swift: "SWIFT",
  spei: "SPEI",
};

/** Map locale to Unlimit lang param (e.g. es -> es_PE, en -> en_US). */
export function localeToUnlimitLang(locale: string): string {
  if (locale.startsWith("es")) return "es_PE";
  if (locale.startsWith("en")) return "en_US";
  return locale;
}

export type BuildUnlimitUrlParams = {
  baseUrl: string;
  wallet: string;
  /** Amount in USD (USDC). Used for offramp (payout). */
  cryptoAmountUsd?: number;
  /** Exact fiat amount. Used for onramp (deposit); when set, cryptoAmount and cryptoCurrencyLock are not used. */
  fiatAmount?: number;
  method: string;
  lang: string;
  /** Fiat currency code (e.g. USD, MXN, EUR). */
  fiatCurrency: string;
  /** When true, blocks changing fiat in the widget. Default true for payout, false for deposit (fiatAmount). */
  fiatCurrencyLock?: boolean;
};

/**
 * Build Unlimit onramp or offramp URL.
 * - Deposit (onramp): pass fiatAmount + fiatCurrency; no crypto amount lock.
 * - Payout (offramp): pass cryptoAmountUsd + fiatCurrency.
 */
export function buildUnlimitUrl({
  baseUrl,
  wallet,
  cryptoAmountUsd,
  fiatAmount,
  method,
  lang,
  fiatCurrency,
  fiatCurrencyLock,
}: BuildUnlimitUrlParams): string {
  const url = new URL(baseUrl);
  const paymentPayout = METHOD_TO_UNLIMIT[method.toLowerCase()] ?? "APPLEPAY";
  url.searchParams.set("wallet", wallet);
  url.searchParams.set("payment", paymentPayout);
  url.searchParams.set("payout", paymentPayout);
  url.searchParams.set("lang", localeToUnlimitLang(lang));
  url.searchParams.set("fiatCurrency", fiatCurrency);
  if (fiatAmount != null) {
    url.searchParams.set("fiatAmount", String(fiatAmount));
    url.searchParams.set("fiatCurrencyLock", "false");
  } else if (cryptoAmountUsd != null) {
    url.searchParams.set("cryptoAmount", String(Math.round(cryptoAmountUsd)));
    url.searchParams.set("fiatCurrencyLock", String(fiatCurrencyLock ?? true));
  }
  return url.toString();
}
