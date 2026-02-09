import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Get Redis client - lazy initialization to allow env vars to be set in tests
function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    throw new Error("Redis credentials not configured");
  }
  
  return new Redis({ url, token });
}

// GET method: Retrieve a value by key
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get("key");

  const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
  const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

  console.log("[Redis API] GET request received", { key, hasUrl: !!UPSTASH_REDIS_REST_URL, hasToken: !!UPSTASH_REDIS_REST_TOKEN });

  if (!key) {
    console.error("[Redis API] GET error: Missing key parameter", {
      file: "app/api/redis/route.ts",
      line: 27,
    });
    return NextResponse.json(
      { error: "Key parameter is required" },
      { status: 400 }
    );
  }

  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.error("[Redis API] GET error: Redis credentials not configured", {
      file: "app/api/redis/route.ts",
      line: 37,
      hasUrl: !!UPSTASH_REDIS_REST_URL,
      hasToken: !!UPSTASH_REDIS_REST_TOKEN,
    });
    return NextResponse.json(
      { error: "Redis credentials not configured" },
      { status: 500 }
    );
  }

  try {
    console.log("[Redis API] GET: Fetching from Redis", { key });
    
    const redis = getRedisClient();
    const value = await redis.get(key);
    
    console.log("[Redis API] GET: Success", { key, value, hasValue: value !== null });
    
    return NextResponse.json({ value: value || null });
  } catch (error) {
    console.error("[Redis API] GET error:", {
      file: "app/api/redis/route.ts",
      line: 59,
      error,
    });
    return NextResponse.json(
      { error: "Failed to fetch from Redis" },
      { status: 500 }
    );
  }
}

// POST method: Set a value by key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
    const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

    console.log("[Redis API] POST request received", { key, value, hasUrl: !!UPSTASH_REDIS_REST_URL, hasToken: !!UPSTASH_REDIS_REST_TOKEN });

    if (!key || value === undefined) {
      console.error("[Redis API] POST error: Missing key or value", {
        file: "app/api/redis/route.ts",
        line: 83,
        key,
        hasValue: value !== undefined,
      });
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      console.error("[Redis API] POST error: Redis credentials not configured", {
        file: "app/api/redis/route.ts",
        line: 96,
        hasUrl: !!UPSTASH_REDIS_REST_URL,
        hasToken: !!UPSTASH_REDIS_REST_TOKEN,
      });
      return NextResponse.json(
        { error: "Redis credentials not configured" },
        { status: 500 }
      );
    }

    console.log("[Redis API] POST: Setting value in Redis", { key, value });

    const redis = getRedisClient();
    const result = await redis.set(key, value);
    
    console.log("[Redis API] POST: Success", { key, value, result });
    
    return NextResponse.json({ success: result === "OK" });
  } catch (error) {
    console.error("[Redis API] POST error:", {
      file: "app/api/redis/route.ts",
      line: 117,
      error,
    });
    return NextResponse.json(
      { error: "Failed to set value in Redis" },
      { status: 500 }
    );
  }
}
