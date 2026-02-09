import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import type { BridgeDepositResponse } from "@/types/bridge";

const BRIDGE_DEPOSIT_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const CACHE_KEY_PREFIX = "bridge_deposit:";

const ETHEREUM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Redis credentials not configured");
  }
  return new Redis({ url, token });
}

/**
 * Fetches deposit address from Polymarket Bridge API.
 * Same logic as POST /api/polymarket/bridge/deposit.
 */
async function fetchDepositFromPolymarket(safeAddress: string): Promise<string> {
  const response = await fetch("https://bridge.polymarket.com/deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: safeAddress }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg =
      (errorData as { message?: string }).message ?? response.statusText;
    throw new Error(`Polymarket bridge deposit failed: ${msg}`);
  }

  const data = (await response.json()) as BridgeDepositResponse;
  const evm = data.address?.evm;
  if (!evm) {
    throw new Error("No EVM deposit address in Polymarket response");
  }
  return evm;
}

/**
 * GET /api/polymarket/bridge/deposit-cache?safeAddress=0x...
 *
 * Get-or-fetch: returns cached deposit address or, on miss/expiry,
 * fetches from Polymarket, writes to Redis with 7-day TTL, and returns it.
 */
export async function GET(request: NextRequest) {
  const safeAddress = request.nextUrl.searchParams.get("safeAddress");

  if (!safeAddress?.trim()) {
    return NextResponse.json(
      { error: "safeAddress query parameter is required" },
      { status: 400 }
    );
  }

  if (!ETHEREUM_ADDRESS_REGEX.test(safeAddress)) {
    return NextResponse.json(
      { error: "Invalid Ethereum address format" },
      { status: 400 }
    );
  }

  const key = `${CACHE_KEY_PREFIX}${safeAddress}`;

  try {
    const redis = getRedisClient();
    const value = await redis.get(key);

    if (value != null && typeof value === "string") {
      return NextResponse.json({ value });
    }

    // Proactive on miss: fetch from Polymarket, cache, return
    const evm = await fetchDepositFromPolymarket(safeAddress);
    await redis.set(key, evm, { ex: BRIDGE_DEPOSIT_CACHE_TTL_SECONDS });
    return NextResponse.json({ value: evm });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    const isRedis =
      message === "Redis credentials not configured" ||
      message.includes("Redis");
    return NextResponse.json(
      { error: isRedis ? "Cache unavailable" : message },
      { status: isRedis ? 503 : 502 }
    );
  }
}

/**
 * POST /api/polymarket/bridge/deposit-cache
 * Body: { safeAddress: string, depositAddress: string }
 *
 * Explicitly write deposit address to cache with 7-day TTL.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { safeAddress, depositAddress } = body as {
      safeAddress?: string;
      depositAddress?: string;
    };

    if (!safeAddress?.trim() || !depositAddress?.trim()) {
      return NextResponse.json(
        { error: "safeAddress and depositAddress are required" },
        { status: 400 }
      );
    }

    if (!ETHEREUM_ADDRESS_REGEX.test(safeAddress)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" },
        { status: 400 }
      );
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return NextResponse.json(
        { error: "Redis credentials not configured" },
        { status: 503 }
      );
    }

    const redis = getRedisClient();
    const key = `${CACHE_KEY_PREFIX}${safeAddress}`;
    const result = await redis.set(key, depositAddress, {
      ex: BRIDGE_DEPOSIT_CACHE_TTL_SECONDS,
    });
    return NextResponse.json({ success: result === "OK" });
  } catch (err) {
    console.error("[deposit-cache] POST error:", err);
    return NextResponse.json(
      { error: "Failed to set deposit cache" },
      { status: 500 }
    );
  }
}
