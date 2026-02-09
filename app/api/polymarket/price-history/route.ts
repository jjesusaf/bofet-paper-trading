import { NextRequest, NextResponse } from "next/server";
import { CLOB_API_URL } from "@/constants/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tokenId = searchParams.get("tokenId");
  const interval = searchParams.get("interval") || "1d"; // 1h, 1d, 1w, 1m, max
  const fidelity = searchParams.get("fidelity") || "60"; // Data point granularity in minutes

  if (!tokenId) {
    return NextResponse.json(
      { error: "tokenId parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Polymarket CLOB API endpoint for price history
    // https://clob.polymarket.com/prices-history
    const url = `${CLOB_API_URL}/prices-history?market=${tokenId}&interval=${interval}&fidelity=${fidelity}`;

    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch price history: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch price history";
    console.error("Error fetching price history:", error);

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
