// Polymarket API URLs
export const RELAYER_URL = "https://relayer-v2.polymarket.com/";
export const CLOB_API_URL = "https://clob.polymarket.com";
export const GEOBLOCK_API_URL = "https://polymarket.com/api/geoblock";
export const GAMMA_API_URL = "https://gamma-api.polymarket.com";
export const POLYMARKET_PROFILE_URL = (address: string) =>
  `https://polymarket.com/${address}`;

// Minimum deposit amount (in USD) for Polymarket bridge (0.40 + 1% fee)
export const MIN_BRIDGE_DEPOSIT = 0.40 * 1.01; // 0.404

// RPC (app default)
export const POLYGON_RPC_URL =
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL || "https://polygon-rpc.com";

/** Public Polygon RPC (publicnode, same as swap_test). */
export const POLYGON_PUBLIC_RPC_URL =
  process.env.NEXT_PUBLIC_POLYGON_PUBLIC_RPC_URL ||
  "https://polygon-bor-rpc.publicnode.com";

/** Private Polygon RPC (BlockPI). */
export const POLYGON_PRIVATE_RPC_URL =
  process.env.NEXT_PUBLIC_POLYGON_PRIVATE_RPC_URL ||
  "https://polygon.blockpi.network/v1/rpc/ef1d9a7433155874e6ffbcfcd8aefef489aa28c5";

/** Which Polygon RPC to use for reads (balances, gas, receipts). Magic = wallet RPC; public/private = dedicated node. */
export type RpcNode = "magic" | "public" | "private";

const RPC_NODE_RAW =
  process.env.NEXT_PUBLIC_RPC_NODE?.toLowerCase().trim() ?? "public";

export function getRpcNode(): RpcNode {
  if (RPC_NODE_RAW === "magic" || RPC_NODE_RAW === "private") return RPC_NODE_RAW;
  return "public";
}

// Remote signing endpoint
export const REMOTE_SIGNING_URL = () =>
  typeof window !== "undefined"
    ? `${window.location.origin}/api/polymarket/sign`
    : "/api/polymarket/sign";

