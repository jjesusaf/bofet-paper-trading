import { NextRequest, NextResponse } from "next/server";
import type {
  BridgeDepositRequest,
  BridgeDepositResponse,
} from "@/types/bridge";

/**
 * POST /api/polymarket/bridge/deposit
 *
 * Fetches a unique deposit address from Polymarket Bridge API.
 * Users send native USDC to this address to receive USDC.e.
 *
 * Request Body:
 *   { address: "0x..." } - User's Safe wallet address
 *
 * Response:
 *   { address: { evm: "0x...", svm: "...", btc: "..." } }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: BridgeDepositRequest = await request.json();

    // Validate input
    if (!body.address) {
      return NextResponse.json(
        { error: "Missing required field: address" },
        { status: 400 }
      );
    }

    // Validate address format (basic Ethereum address check)
    if (!body.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid Ethereum address format" },
        { status: 400 }
      );
    }

    // Call Polymarket Bridge API
    const response = await fetch("https://bridge.polymarket.com/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: body.address }),
      }
    );

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Bridge Deposit API] Error:", response.status, errorData);

      return NextResponse.json(
        {
          error: "Failed to fetch deposit address",
          details: errorData.message || response.statusText,
        },
        { status: response.status }
      );
    }

    // Parse and return response
    const data: BridgeDepositResponse = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Bridge Deposit API] Unexpected error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
