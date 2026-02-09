import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { z } from "zod";

// Get Redis client - lazy initialization to allow env vars to be set in tests
function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    throw new Error("Redis credentials not configured");
  }
  
  return new Redis({ url, token });
}

const json = (body: object, status: number) =>
  NextResponse.json(body, { status });

const onboardingSchema = z.object({
  question_name: z.enum(["source", "experience"], {
    message: "question_name must be 'source' or 'experience'",
  }),
  answer: z.string().min(1, "Answer is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message =
        (first.question_name?.[0] ??
          first.answer?.[0] ??
          "Invalid input") as string;
      return json({ message }, 400);
    }

    const { question_name, answer } = parsed.data;
    const timestamp = new Date().toISOString();
    const uuid = crypto.randomUUID();
    const key = `app:onboarding:${question_name}:${timestamp}:${uuid}`;

    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL_FORMS;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN_FORMS;

    if (!upstashUrl || !upstashToken) {
      console.error("[api/onboarding] Missing Upstash credentials");
      return json(
        { message: "Server configuration error. Please try again later." },
        500
      );
    }

    const redis = getRedisClient();

    const payload: Record<string, string> = {
      answer,
      submitted_at: timestamp,
    };
    
    await redis.set(key, JSON.stringify(payload));

    return json({ message: "Success!" }, 200);
  } catch (err) {
    console.error("[api/onboarding]", err);
    return json(
      { message: "Something went wrong. Please try again." },
      500
    );
  }
}
