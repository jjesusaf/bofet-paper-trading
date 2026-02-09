import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/polymarket/bridge/withdraw
 *
 * Fetches a unique withdrawal address from Polymarket Bridge API.
 * Users send USDC.e to this address to receive native USDC on destination chain.
 *
 * Request Body:
 *   {
 *     address: "0x...",              // User's Safe wallet address (on Polygon)
 *     toChainId: "137",              // Destination chain ID (137 = Polygon)
 *     toTokenAddress: "0x...",       // Destination token address (USDC on Polygon)
 *     recipientAddr: "0x..."         // Recipient address (usually same as Safe)
 *   }
 *
 * Response:
 *   { address: { evm: "0x...", svm: "...", btc: "..." } }
 */

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

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: BridgeWithdrawRequest = await request.json();

    // Validate input
    if (!body.address || !body.toChainId || !body.toTokenAddress || !body.recipientAddr) {
      return NextResponse.json(
        { error: "Missing required fields: address, toChainId, toTokenAddress, recipientAddr" },
        { status: 400 }
      );
    }

    // Validate address formats
    if (!body.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid address format" },
        { status: 400 }
      );
    }

    if (!body.toTokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid toTokenAddress format" },
        { status: 400 }
      );
    }

    if (!body.recipientAddr.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid recipientAddr format" },
        { status: 400 }
      );
    }

    console.log("[Bridge Withdraw API] Requesting withdrawal address:", {
      address: body.address,
      toChainId: body.toChainId,
      toTokenAddress: body.toTokenAddress,
      recipientAddr: body.recipientAddr,
    });

    // Call Polymarket Bridge API
    const response = await fetch("https://bridge.polymarket.com/withdraw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: body.address,
        toChainId: body.toChainId,
        toTokenAddress: body.toTokenAddress,
        recipientAddr: body.recipientAddr,
      }),
    });

    // Handle API errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Bridge Withdraw API] Error:", response.status, errorData);

      return NextResponse.json(
        {
          error: "Failed to fetch withdrawal address",
          details: errorData.message || response.statusText,
        },
        { status: response.status }
      );
    }

    // Parse and return response
    const data: BridgeWithdrawResponse = await response.json();

    console.log("[Bridge Withdraw API] Success:", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Bridge Withdraw API] Unexpected error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
