/**
 * Uniswap V4 quote utility for USDC.e → Native USDC.
 * Uses V4 Quoter quoteExactInputSingle via simulateContract (no on-chain execution).
 * Ref: phase_2.txt, IV4Quoter.
 * Handles UnexpectedRevertBytes(bytes) by decoding inner reason (e.g. Error(string)).
 */

import type { PublicClient } from "viem";
import {
  createPublicClient,
  decodeErrorResult,
  decodeAbiParameters,
  http,
} from "viem";
import { polygon } from "viem/chains";
import { UNISWAP_V4_QUOTER } from "@/constants/uniswap";
import { v4QuoterAbi } from "@/constants/abis/uniswapV4";
import { getPoolKey } from "@/utils/uniswapV4Swap";
import { POLYGON_RPC_URL } from "@/constants/api";

/** Selector for Solidity Error(string). Used to decode inner revert reason. */
const ERROR_STRING_SELECTOR = "0x08c379a0";

/** Delay (ms) before retrying after rate-limit. Matches "retry in 10s" from polygon-rpc.com. */
const RATE_LIMIT_RETRY_MS = 12_000;
const MAX_RETRIES = 2;

function isRateLimitError(err: unknown): boolean {
  const parts: string[] = [];
  if (err instanceof Error) parts.push(err.message, String(err.cause ?? ""));
  else if (typeof err === "object" && err !== null) {
    if ("details" in err) parts.push(String((err as { details: unknown }).details));
    if ("message" in err) parts.push(String((err as { message: unknown }).message));
    parts.push(JSON.stringify(err));
  } else {
    parts.push(String(err));
  }
  const combined = parts.join(" ");
  return /rate limit|retry in|too many requests|call rate limit exhausted/i.test(combined);
}

export interface GetSwapQuoteOptions {
  publicClient?: PublicClient;
}

export interface SwapQuoteResult {
  amountOut: bigint;
  priceImpact?: number;
}

/**
 * Returns expected amountOut for exact-in USDC.e → USDC swap.
 * Uses simulateContract so the Quoter is not executed on-chain.
 * Pass publicClient from useWallet() when available to reuse the client.
 */
export async function getSwapQuote(
  amountIn: bigint,
  options?: GetSwapQuoteOptions
): Promise<SwapQuoteResult> {
  const client =
    options?.publicClient ??
    createPublicClient({
      chain: polygon,
      transport: http(POLYGON_RPC_URL),
    });

  const poolKey = getPoolKey();
  const params = {
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: poolKey.fee,
      tickSpacing: poolKey.tickSpacing,
      hooks: poolKey.hooks,
    },
    zeroForOne: true, // USDC.e → USDC (currency0 → currency1)
    exactAmount: amountIn,
    hookData: "0x" as `0x${string}`,
  };

  console.log("[getSwapQuote] Quote operation params:", {
    quoterAddress: UNISWAP_V4_QUOTER,
    rpc: options?.publicClient ? "(provided publicClient)" : POLYGON_RPC_URL,
    poolKey: {
      currency0: poolKey.currency0,
      currency1: poolKey.currency1,
      fee: poolKey.fee,
      tickSpacing: poolKey.tickSpacing,
      hooks: poolKey.hooks,
    },
    zeroForOne: params.zeroForOne,
    exactAmount: amountIn.toString(),
    exactAmountFormatted: `${Number(amountIn) / 1e6} USDC.e`,
  });

  const runQuote = async () =>
    client.simulateContract({
      address: UNISWAP_V4_QUOTER,
      abi: v4QuoterAbi,
      functionName: "quoteExactInputSingle",
      args: [params],
      account: "0x0000000000000000000000000000000000000000",
    });

  let lastErr: unknown;
  try {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await runQuote();
        const amountOut = result.result[0];
        const priceImpact =
          amountIn > BigInt(0)
            ? Number(((amountIn - amountOut) * BigInt(10000)) / amountIn) / 100
            : undefined;
        return { amountOut, priceImpact };
      } catch (err: unknown) {
        lastErr = err;
        if (attempt < MAX_RETRIES && isRateLimitError(err)) {
          console.warn(
            `[getSwapQuote] RPC rate limit (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${RATE_LIMIT_RETRY_MS / 1000}s…`
          );
          await new Promise((r) => setTimeout(r, RATE_LIMIT_RETRY_MS));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  } catch (err: unknown) {
    const cause = err && typeof err === "object" && "cause" in err ? (err as { cause?: unknown }).cause : err;
    const raw =
      cause && typeof cause === "object" && "raw" in cause && typeof (cause as { raw?: unknown }).raw === "string"
        ? ((cause as { raw: string }).raw as `0x${string}`)
        : err && typeof err === "object" && "data" in err && typeof (err as { data?: unknown }).data === "string"
          ? ((err as { data: string }).data as `0x${string}`)
          : null;

    if (raw && raw.length >= 10) {
      try {
        const decoded = decodeErrorResult({
          abi: v4QuoterAbi,
          data: raw,
        });
        if (decoded.errorName === "UnexpectedRevertBytes" && decoded.args[0]) {
          const inner = decoded.args[0] as `0x${string}`;
          if (inner.startsWith(ERROR_STRING_SELECTOR)) {
            const tail = (`0x${inner.slice(10)}` as `0x${string}`);
            const [message] = decodeAbiParameters([{ type: "string" }], tail);


            throw new Error(`Quote failed: ${message}`);
          }
          throw new Error(
            `Quote failed: unexpected revert (UnexpectedRevertBytes). Inner hex: ${inner.slice(0, 66)}…`
          );
        }
      } catch (decodeErr) {
        if (decodeErr instanceof Error && decodeErr.message.startsWith("Quote failed:"))
          throw decodeErr;
      }
    }
    throw err;
  }
}
