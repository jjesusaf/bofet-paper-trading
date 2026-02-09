/**
 * DataFast Goal Tracking API Route
 * 
 * This route handles server-side goal tracking for DataFast analytics.
 * All goals are tracked via this backend route to ensure proper user identification
 * via the datafast_visitor_id cookie.
 * 
 * Tracked Events:
 * 
 * 1. signup
 *    Location: components/Navbar/index.tsx
 *    Trigger: When user clicks connect/signup button and is not logged in
 *    Function: handleConnect() - when !eoaAddress
 * 
 * 2. onboarding_complete
 *    Location: components/Onboarding/index.tsx
 *    Trigger: When user completes the onboarding survey
 *    Function: handleComplete() - after saving to localStorage
 * 
 * 3. wallet_created
 *    Location: hooks/useTradingSession.ts
 *    Trigger: When Safe wallet is successfully deployed for the first time
 *    Function: initializeTradingSession() - after deploySafe() completes
 * 
 * 4. deposit_modal_triggered
 *    Location: components/Header/TradingBalance.tsx
 *    Trigger: When user clicks the deposit button (first time deposit modal opens)
 *    Function: onClick handler for deposit button
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const json = (body: object, status: number) =>
  NextResponse.json(body, { status });

const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const parsed = goalSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message =
        (first.name?.[0] ?? "Invalid input") as string;
      return json({ message }, 400);
    }

    const { name, metadata } = parsed.data;

    // Get datafast_visitor_id from cookies
    const datafastVisitorId = request.cookies.get("datafast_visitor_id")?.value;

    if (!datafastVisitorId) {
      return json(
        { message: "datafast_visitor_id cookie not found" },
        400
      );
    }

    // Get DataFast API key from environment
    const datafastApiKey = process.env.DATAFAST_API_KEY;

    if (!datafastApiKey) {
      console.error("[api/datafast/goal] Missing DATAFAST_API_KEY");
      return json(
        { message: "Server configuration error. Please try again later." },
        500
      );
    }

    // Call DataFast API
    const response = await fetch("https://datafa.st/api/v1/goals", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${datafastApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        datafast_visitor_id: datafastVisitorId,
        name,
        ...(metadata && { metadata }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[api/datafast/goal] DataFast API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return json(
        { message: "Failed to track goal with DataFast" },
        response.status
      );
    }

    const result = await response.json();

    return json({ message: "Goal tracked successfully", data: result }, 200);
  } catch (err) {
    console.error("[api/datafast/goal]", err);
    return json(
      { message: "Something went wrong. Please try again." },
      500
    );
  }
}
