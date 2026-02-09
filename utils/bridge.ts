/**
 * Bridge utility functions for USDC → USDC.e conversion
 * Used by Phase 3 hooks to send native USDC to the bridge, fetch deposit address,
 * and poll until conversion is complete.
 *
 * Client-side use: fetch uses relative "/api/..." URLs (same origin in browser).
 */

import type {
  BridgeDepositResponse,
  BridgeTransaction,
  BridgeTransactionStatusResponse,
} from "@/types/bridge";
import { parseUnits, formatUnits } from "viem";
import { USDC_DECIMALS } from "@/constants/tokens";
import { MIN_BRIDGE_DEPOSIT } from "@/constants/api";

// Endpoints (relative for client-side fetch)
const BRIDGE_DEPOSIT_URL = "/api/polymarket/bridge/deposit";
const BRIDGE_STATUS_URL = "/api/polymarket/bridge/status";

const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_TIMEOUT_MS = 300_000;
const MAX_RETRIES = 3;
const EXTENDED_WAIT_THRESHOLD_MS = 30_000;

// =============================================================================
// Result type and errors
// =============================================================================

export type BridgeStatusResult =
  | { kind: "pending" }
  | { kind: "completed"; transaction?: BridgeTransaction }
  | { kind: "failed"; error?: string };

export interface BridgeWaitOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  onStatusChange?: (result: BridgeStatusResult) => void;
  onExtendedWait?: (elapsedSeconds: number) => void;
}

/**
 * Error thrown when bridge conversion times out.
 * The user's USDC is safe; conversion will complete automatically.
 */
export class BridgeTimeoutError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "Bridge conversion is taking longer than expected. Your USDC is safe and the conversion will complete automatically. Please try again in a few minutes."
    );
    this.name = "BridgeTimeoutError";
    Object.setPrototypeOf(this, BridgeTimeoutError.prototype);
  }
}

/**
 * Error thrown when bridge deposit fails permanently.
 */
export class BridgeDepositError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BridgeDepositError";
    Object.setPrototypeOf(this, BridgeDepositError.prototype);
  }
}

// =============================================================================
// Helpers
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Core: fetch deposit address
// =============================================================================

/**
 * Fetches the bridge deposit address for a Safe.
 * POST /api/polymarket/bridge/deposit with { address: safeAddress }.
 * Retries up to MAX_RETRIES with exponential backoff (1000 * attempt ms).
 */
export async function fetchBridgeDepositAddress(
  safeAddress: string
): Promise<BridgeDepositResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(BRIDGE_DEPOSIT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: safeAddress }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error ?? `HTTP ${response.status}`
        );
      }

      return (await response.json()) as BridgeDepositResponse;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt);
      }
    }
  }

  throw lastError ?? new Error("Failed to fetch deposit address");
}

// =============================================================================
// Core: check status → BridgeStatusResult
// =============================================================================

/**
 * Checks bridge status for a deposit address.
 * GET /api/polymarket/bridge/status?depositAddress=...
 * Maps route response to BridgeStatusResult:
 * - 200 + { status: "pending", message } → { kind: "pending" }
 * - 200 + { transactions } with any COMPLETED → { kind: "completed", transaction }
 * - 200 + { transactions } with any FAILED → { kind: "failed", error }
 * - else → { kind: "pending" }
 */
export async function checkBridgeStatus(
  depositAddress: string
): Promise<BridgeStatusResult> {
  const url = `${BRIDGE_STATUS_URL}?depositAddress=${encodeURIComponent(depositAddress)}`;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { error?: string }).error ?? `HTTP ${response.status}`
    );
  }

  const json = (await response.json()) as
    | BridgeTransactionStatusResponse
    | { status: "pending"; message?: string };

  if ("status" in json && json.status === "pending") {
    return { kind: "pending" };
  }

  if (
    "transactions" in json &&
    Array.isArray((json as BridgeTransactionStatusResponse).transactions)
  ) {
    const txList = (json as BridgeTransactionStatusResponse).transactions;
    const completed = txList.find((t) => t.status === "COMPLETED");
    if (completed) {
      return { kind: "completed", transaction: completed };
    }
    const failed = txList.find((t) => t.status === "FAILED");
    if (failed) {
      const err =
        (failed as BridgeTransaction & { error?: string }).error ??
        "Bridge deposit failed";
      return { kind: "failed", error: err };
    }
  }

  return { kind: "pending" };
}

// =============================================================================
// Core: wait until completed / failed / timeout
// =============================================================================

/**
 * Polls checkBridgeStatus until kind is "completed", then returns.
 * On "failed" throws BridgeDepositError; on timeout throws BridgeTimeoutError.
 * Calls onStatusChange when result changes; calls onExtendedWait once when
 * elapsed > EXTENDED_WAIT_THRESHOLD_MS.
 */
export async function waitForBridgeCompletion(
  depositAddress: string,
  options: BridgeWaitOptions = {}
): Promise<BridgeStatusResult> {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const { onStatusChange, onExtendedWait } = options;

  const startTime = Date.now();
  let lastResult: BridgeStatusResult | null = null;
  let hasNotifiedExtendedWait = false;

  while (true) {
    const elapsed = Date.now() - startTime;

    if (elapsed > EXTENDED_WAIT_THRESHOLD_MS && !hasNotifiedExtendedWait) {
      hasNotifiedExtendedWait = true;
      onExtendedWait?.(Math.floor(elapsed / 1000));
    }

    if (elapsed > timeoutMs) {
      throw new BridgeTimeoutError();
    }

    const result = await checkBridgeStatus(depositAddress);

    const resultChanged =
      lastResult === null ||
      lastResult.kind !== result.kind ||
      (result.kind === "completed" &&
        lastResult.kind === "completed" &&
        lastResult.transaction !== result.transaction);
    if (resultChanged) {
      lastResult = result;
      onStatusChange?.(result);
    }

    if (result.kind === "completed") {
      return result;
    }
    if (result.kind === "failed") {
      throw new BridgeDepositError(result.error ?? "Bridge deposit failed");
    }

    await sleep(pollIntervalMs);
  }
}

// =============================================================================
// Optional: amount helpers
// =============================================================================

/** amount * 10**USDC_DECIMALS — uses viem parseUnits for decimal-safe conversion */
export function parseUsdcAmount(amount: number): bigint {
  return parseUnits(amount.toFixed(USDC_DECIMALS), USDC_DECIMALS);
}

/** Number(amount) / 10**USDC_DECIMALS — uses viem formatUnits */
export function formatUsdcAmount(amount: bigint): number {
  return parseFloat(formatUnits(amount, USDC_DECIMALS));
}

/** amountUsd >= MIN_BRIDGE_DEPOSIT */
export function meetsMinimumDeposit(amountUsd: number): boolean {
  return amountUsd >= MIN_BRIDGE_DEPOSIT;
}

/**
 * If availableUsdce >= requiredAmount return 0.
 * Else shortfall = requiredAmount - availableUsdce,
 * buffer = shortfall * (bufferPercent / 100), return shortfall + buffer.
 * Default bufferPercent = 1. Uses BigInt(0)/BigInt(100) for ES2017 compat.
 */
export function calculateConversionShortfall(
  requiredAmount: bigint,
  availableUsdce: bigint,
  bufferPercent: number = 1
): bigint {
  if (availableUsdce >= requiredAmount) {
    return BigInt(0);
  }
  const shortfall = requiredAmount - availableUsdce;
  const buffer = (shortfall * BigInt(bufferPercent)) / BigInt(100);
  return shortfall + buffer;
}

// =============================================================================
// Withdrawal: USDC.e → USDC (reverse bridge)
// =============================================================================

const BRIDGE_WITHDRAW_URL = "/api/polymarket/bridge/withdraw";

export interface BridgeWithdrawRequest {
  address: string;
  toChainId: string;
  toTokenAddress: string;
  recipientAddr: string;
}

export interface BridgeWithdrawResponse {
  address: {
    evm: string;
    svm: string;
    btc: string;
  };
}

/**
 * Fetches a withdrawal address from Polymarket Bridge API.
 * Users send USDC.e to this address to receive native USDC.
 *
 * @param safeAddress - Safe address on Polygon
 * @param toChainId - Destination chain ID (e.g., "137" for Polygon)
 * @param toTokenAddress - Destination token address (native USDC)
 * @param recipientAddr - Recipient address (usually same as Safe)
 * @returns Withdrawal address response with evm/svm/btc addresses
 *
 * @example
 * ```typescript
 * const response = await fetchBridgeWithdrawAddress(
 *   "0xYourSafe...",
 *   "137",
 *   "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC on Polygon
 *   "0xYourSafe..."
 * );
 * console.log("Send USDC.e to:", response.address.evm);
 * ```
 */
export async function fetchBridgeWithdrawAddress(
  safeAddress: string,
  toChainId: string,
  toTokenAddress: string,
  recipientAddr: string
): Promise<BridgeWithdrawResponse> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(BRIDGE_WITHDRAW_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: safeAddress,
          toChainId,
          toTokenAddress,
          recipientAddr,
        } as BridgeWithdrawRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Bridge withdraw API error ${response.status}: ${
            errorData.error || response.statusText
          }`
        );
      }

      const data: BridgeWithdrawResponse = await response.json();
      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(
        `[fetchBridgeWithdrawAddress] Attempt ${attempt}/${MAX_RETRIES} failed:`,
        lastError
      );
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError ?? new Error("Failed to fetch withdrawal address");
}
