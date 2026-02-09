import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { z } from "zod";
import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  parseGwei,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { sendGasAbi } from "@/constants/abis/sendGas";
import { SEND_GAS_CONTRACT_ADDRESS } from "@/constants/tokens";

const REDIS_KEY_PREFIX = "sendgas:";

function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error("Redis credentials not configured");
  }
  return new Redis({ url, token });
}

function getPrivateRpcUrl(): string {
  return (
    process.env.NEXT_PUBLIC_POLYGON_PRIVATE_RPC_URL ||
    "https://polygon.blockpi.network/v1/rpc/ef1d9a7433155874e6ffbcfcd8aefef489aa28c5"
  );
}

// ────────────────────────────────────────────────────────
// GET — Check if wallet already claimed (Redis-first)
// ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");

  if (!address || !isAddress(address)) {
    return NextResponse.json(
      { error: "Valid address parameter is required" },
      { status: 400 },
    );
  }

  const normalizedAddress = address.toLowerCase();

  try {
    const redis = getRedisClient();
    const cached = await redis.get<string>(`${REDIS_KEY_PREFIX}${normalizedAddress}`);

    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached;
      return NextResponse.json({
        hasClaimed: true,
        txHash: data.txHash ?? null,
      });
    }

    // Fallback: check on-chain
    const publicClient = createPublicClient({
      chain: polygon,
      transport: http(getPrivateRpcUrl()),
    });

    const hasClaimed = await publicClient.readContract({
      address: SEND_GAS_CONTRACT_ADDRESS,
      abi: sendGasAbi,
      functionName: "hasClaimedGas",
      args: [normalizedAddress as `0x${string}`],
    });

    if (hasClaimed) {
      // Backfill Redis so future checks are fast
      await redis.set(
        `${REDIS_KEY_PREFIX}${normalizedAddress}`,
        JSON.stringify({ txHash: null, timestamp: Date.now() }),
      );
    }

    return NextResponse.json({ hasClaimed: !!hasClaimed, txHash: null });
  } catch (error) {
    console.error("[SendGas GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to check claim status" },
      { status: 500 },
    );
  }
}

// ────────────────────────────────────────────────────────
// POST — Execute claim via relayer
// ────────────────────────────────────────────────────────

const claimSchema = z.object({
  recipient: z.string().refine((v) => isAddress(v), "Invalid recipient address"),
  deadline: z.number().int().positive(),
  signature: z
    .string()
    .regex(/^0x[0-9a-fA-F]{130}$/, "Signature must be 65 bytes hex with 0x prefix"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { recipient, deadline, signature } = parsed.data;
  const normalizedRecipient = recipient.toLowerCase();

  // Validate deadline is in the future
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (deadline <= nowSeconds) {
    return NextResponse.json(
      { error: "Deadline has already passed" },
      { status: 400 },
    );
  }

  // Check relayer private key
  const relayerPrivateKey = process.env.GAS_RELAYER_PRIVATE_KEY;
  if (!relayerPrivateKey) {
    console.error("[SendGas POST] GAS_RELAYER_PRIVATE_KEY not configured");
    return NextResponse.json(
      { error: "Relayer not configured" },
      { status: 500 },
    );
  }

  try {
    // 1. Check Redis first — avoid wasting gas
    const redis = getRedisClient();
    const cached = await redis.get<string>(
      `${REDIS_KEY_PREFIX}${normalizedRecipient}`,
    );

    if (cached) {
      return NextResponse.json(
        { error: "Gas already claimed for this wallet" },
        { status: 409 },
      );
    }

    // 2. Set up relayer wallet + clients
    const rpcUrl = getPrivateRpcUrl();

    const formattedKey = relayerPrivateKey.startsWith("0x")
      ? relayerPrivateKey
      : `0x${relayerPrivateKey}`;

    const account = privateKeyToAccount(
      formattedKey as `0x${string}`,
    );

    const publicClient = createPublicClient({
      chain: polygon,
      transport: http(rpcUrl),
    });

    const walletClient = createWalletClient({
      account,
      chain: polygon,
      transport: http(rpcUrl),
    });

    // 3. Simulate to catch reverts before spending gas
    const { request: simulatedRequest } = await publicClient.simulateContract({
      account,
      address: SEND_GAS_CONTRACT_ADDRESS,
      abi: sendGasAbi,
      functionName: "claimGasFor",
      args: [
        recipient as `0x${string}`,
        BigInt(deadline),
        signature as `0x${string}`,
      ],
    });

    // 4. Execute with dynamic EIP-1559 gas params
    const block = await publicClient.getBlock({ blockTag: "latest" });
    const baseFee = block.baseFeePerGas ?? BigInt(0);
    const priorityFee = parseGwei("30");
    // 2x base fee + priority tip — generous buffer for Polygon spikes
    const maxFee = baseFee * BigInt(2) + priorityFee;

    const txHash = await walletClient.writeContract({
      ...simulatedRequest,
      maxPriorityFeePerGas: priorityFee,
      maxFeePerGas: maxFee,
    } as any);

    console.log(`[SendGas POST] Transaction sent: ${txHash}`);

    // 5. Wait for receipt
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 120_000,
    });

    if (receipt.status === "reverted") {
      console.error("[SendGas POST] Transaction reverted:", txHash);
      return NextResponse.json(
        { error: "Transaction reverted on-chain" },
        { status: 500 },
      );
    }

    console.log(`[SendGas POST] Transaction confirmed: ${txHash}`);

    // 6. Write to Redis
    await redis.set(
      `${REDIS_KEY_PREFIX}${normalizedRecipient}`,
      JSON.stringify({ txHash, timestamp: Date.now() }),
    );

    return NextResponse.json({ success: true, transactionHash: txHash });
  } catch (error: any) {
    console.error("[SendGas POST] Error:", error);

    // If the contract reverted with AlreadyClaimed, cache it
    const message = error?.message ?? String(error);
    if (message.includes("AlreadyClaimed")) {
      try {
        const redis = getRedisClient();
        await redis.set(
          `${REDIS_KEY_PREFIX}${normalizedRecipient}`,
          JSON.stringify({ txHash: null, timestamp: Date.now() }),
        );
      } catch {
        // Ignore Redis errors in error handler
      }
      return NextResponse.json(
        { error: "Gas already claimed for this wallet" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: message.slice(0, 200) },
      { status: 500 },
    );
  }
}
