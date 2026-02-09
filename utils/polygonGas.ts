/**
 * Polygon EIP-1559 gas params and RPC client for EOA transactions.
 * Ref: swap_test/swap_gnosis_v2.ts + utils/calc_polygon_gas.ts (min 25 Gwei tip).
 * Client is chosen by NEXT_PUBLIC_RPC_NODE (public | private | magic). When "magic", gas/receipt still use public node to avoid rate limit.
 */

import { createPublicClient, http } from "viem";
import { polygon } from "viem/chains";
import type { PublicClient } from "viem";
import {
  POLYGON_PUBLIC_RPC_URL,
  POLYGON_PRIVATE_RPC_URL,
  getRpcNode,
} from "@/constants/polymarket";

/** Polygon minimum tip (25 Gwei per reference). */
const MIN_TIP_WEI = BigInt(25_000_000_000);
/** Fallback priority fee (30 Gwei). */
const FALLBACK_PRIORITY_WEI = BigInt(30_000_000_000);
/** 50% bump for replacement txs (per reference). */
const GAS_BUMP_PERCENT = BigInt(150);

export interface PolygonEip1559GasParams {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

let _publicRpcClient: PublicClient | null = null;
let _privateRpcClient: PublicClient | null = null;

/**
 * Polygon client for the configured RPC node (NEXT_PUBLIC_RPC_NODE).
 * - public: polygon-bor-rpc.publicnode.com
 * - private: polygon.blockpi.network
 * - magic: returns public client so gas/receipt don't hit Magic (wallet RPC used only for sendTransaction).
 */
export function getPolygonRpcClient(): PublicClient {
  const node = getRpcNode();
  if (node === "private") {
    if (!_privateRpcClient) {
      _privateRpcClient = createPublicClient({
        chain: polygon,
        transport: http(POLYGON_PRIVATE_RPC_URL),
      });
    }
    return _privateRpcClient;
  }
  if (!_publicRpcClient) {
    _publicRpcClient = createPublicClient({
      chain: polygon,
      transport: http(POLYGON_PUBLIC_RPC_URL),
    });
  }
  return _publicRpcClient;
}

/** Alias for getPolygonRpcClient(); use for gas params and waitForTransactionReceipt. */
export function getPublicPolygonClient(): PublicClient {
  return getPolygonRpcClient();
}

/**
 * Returns EIP-1559 gas params for Polygon using the public RPC (not Magic).
 * Ensures at least 25 Gwei tip so txs are accepted by the chain.
 */
export async function getPolygonEip1559GasParams(
  publicClient?: PublicClient
): Promise<PolygonEip1559GasParams> {
  const client = publicClient ?? getPublicPolygonClient();
  try {
    const feeHistory = await client.getFeeHistory({
      blockCount: 1,
      rewardPercentiles: [25, 75],
    });
    const baseFee =
      feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1] ?? BigInt(0);
    const reward = feeHistory.reward?.[0];
    const rawTip = reward && (reward[1] ?? reward[0]);
    const priorityFee =
      rawTip && rawTip >= MIN_TIP_WEI ? rawTip : MIN_TIP_WEI;
    const tipBumped = (priorityFee * GAS_BUMP_PERCENT) / BigInt(100);
    const maxFeeRaw = baseFee + priorityFee;
    const maxFeeBumped =
      maxFeeRaw > tipBumped ? (maxFeeRaw * GAS_BUMP_PERCENT) / BigInt(100) : tipBumped * BigInt(2);
    return {
      maxPriorityFeePerGas: tipBumped,
      maxFeePerGas: maxFeeBumped,
    };
  } catch {
    const gasPrice = await client.getGasPrice();
    const priorityFee =
      gasPrice >= MIN_TIP_WEI ? gasPrice : FALLBACK_PRIORITY_WEI;
    const tipBumped = (priorityFee * GAS_BUMP_PERCENT) / BigInt(100);
    return {
      maxPriorityFeePerGas: tipBumped,
      maxFeePerGas: tipBumped * BigInt(2),
    };
  }
}
