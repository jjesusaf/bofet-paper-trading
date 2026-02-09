import { NextRequest, NextResponse } from "next/server";
import type {
  BridgeStatusResponse,
  BridgeTransactionStatusResponse,
} from "@/types/bridge";

/**
 * GET /api/polymarket/bridge/status?depositAddress=0x...
 *
 * Proxies Polymarket Bridge GET /status/{address}.
 * https://docs.polymarket.com/api-reference/bridge/get-deposit-status
 *
 * Query Params:
 *   depositAddress - EVM/SVM/BTC deposit address from /deposit
 *
 * Response 200:
 *   { transactions: [{ fromChainId, fromTokenAddress, fromAmountBaseUnit,
 *      toChainId, toTokenAddress, status, txHash?, createdTimeMs? }, ...] }
 *   status: DEPOSIT_DETECTED | PROCESSING | ORIGIN_TX_CONFIRMED | SUBMITTED | COMPLETED | FAILED
 *   Empty transactions array = no deposits to this address yet.
 *
 * Response 200 (when upstream returns 404): { status: "pending", message: "No deposit detected yet" }
 */
export async function GET(request: NextRequest) {
  try {
    // Get deposit address from query params
    const { searchParams } = new URL(request.url);
    const depositAddress = searchParams.get("depositAddress");

    // Validate input
    if (!depositAddress) {
      return NextResponse.json(
        { error: "Missing required query parameter: depositAddress" },
        { status: 400 }
      );
    }

    // Validate address format
    if (!depositAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid deposit address format" },
        { status: 400 }
      );
    }

    // Call Polymarket Bridge Status API
    const response = await fetch(
      `https://bridge.polymarket.com/status/${depositAddress}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Prevent caching to always get fresh status
        cache: "no-store",
      }
    );

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Bridge Status API] Error:", response.status, errorData);

      // Return specific status for not found (no deposit yet)
      if (response.status === 404) {
        return NextResponse.json({
          status: "pending",
          message: "No deposit detected yet",
        } as BridgeStatusResponse);
      }

      return NextResponse.json(
        {
          error: "Failed to fetch deposit status",
          details: errorData.message || response.statusText,
        },
        { status: response.status }
      );
    }

    // Parse response (real API: { transactions: BridgeTransaction[] })
    const data: BridgeTransactionStatusResponse = await response.json();

    // Polymarket's GET /status/{address} returns all transactions and does not support
    // a limit or pagination param (see https://docs.polymarket.com/api-reference/bridge/get-deposit-status).
    // Limit to the most recent 10 server-side. createdTimeMs is missing when status is DEPOSIT_DETECTED
    // (deposit seen, not yet processing); treat those as newest so in-flight deposits stay in the top 10.
    const byNewest = [...(data.transactions ?? [])].sort((a, b) => {
      const aMs = a.createdTimeMs ?? Number.POSITIVE_INFINITY;
      const bMs = b.createdTimeMs ?? Number.POSITIVE_INFINITY;
      return bMs - aMs;
    });
    const limited: BridgeTransactionStatusResponse = {
      transactions: byNewest.slice(0, 10),
    };

    return NextResponse.json(limited);
  } catch (error) {
    console.error("[Bridge Status API] Unexpected error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
