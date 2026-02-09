/**
 * Uniswap V4 swap utilities for USDC.e → Native USDC (rebalance / CLAIM REWARD).
 * Builds SafeTransactions for approve + Universal Router execute(V4_SWAP).
 * Ref: phase_2.txt, Uniswap v4-sdk v4Planner.ts, Universal Router technical-reference.
 */

import {
  OperationType,
  SafeTransaction,
} from "@polymarket/builder-relayer-client";
import { encodeAbiParameters, encodeFunctionData, erc20Abi } from "viem";
import {
  USDC_CONTRACT_ADDRESS,
  USDC_E_CONTRACT_ADDRESS,
} from "@/constants/tokens";
import {
  UNISWAP_V4_UNIVERSAL_ROUTER,
  USDC_E_TO_USDC_POOL_FEE,
} from "@/constants/uniswap";
import {
  Actions,
  universalRouterAbi,
  type PoolKey,
} from "@/constants/abis/uniswapV4";

const ZERO_HOOKS = "0x0000000000000000000000000000000000000000" as const;

/** Params for encodeV4SwapCommand. Recipient = Safe (output goes to msg.sender when Safe executes). */
export interface V4SwapParams {
  amountIn: bigint;
  minAmountOut: bigint;
  recipient: `0x${string}`;
}

/** ExactInputSingleParams: (PoolKey, bool, uint128, uint128, bytes). Per IV4Router. */
const exactInputSingleAbi = [
  {
    name: "poolKey",
    type: "tuple",
    components: [
      { name: "currency0", type: "address" },
      { name: "currency1", type: "address" },
      { name: "fee", type: "uint24" },
      { name: "tickSpacing", type: "int24" },
      { name: "hooks", type: "address" },
    ],
  },
  { name: "zeroForOne", type: "bool" },
  { name: "amountIn", type: "uint128" },
  { name: "amountOutMinimum", type: "uint128" },
  { name: "hookData", type: "bytes" },
] as const;

/**
 * Returns the fixed USDC.e/USDC pool key.
 * currency0 = USDC.e, currency1 = Native USDC (per Uniswap pool).
 * USDC.e → USDC = zeroForOne = true (currency0 → currency1).
 */
export function getPoolKey(): PoolKey {
  return {
    currency0: USDC_E_CONTRACT_ADDRESS,
    currency1: USDC_CONTRACT_ADDRESS,
    fee: USDC_E_TO_USDC_POOL_FEE,
    tickSpacing: 1,
    hooks: ZERO_HOOKS as `0x${string}`,
  };
}

/**
 * Encodes the single "input" for the V4_SWAP command: (bytes actions, bytes[] params).
 * Actions: SWAP_EXACT_IN_SINGLE (0x06), SETTLE_ALL (0x0c), TAKE_ALL (0x0f).
 * Params: [ExactInputSingleParams, (currency, maxAmount), (currency, minAmount)].
 * Per Uniswap v4-sdk v4Planner: SETTLE_ALL(currency, maxAmount), TAKE_ALL(currency, minAmount).
 */
export function encodeV4SwapCommand(params: V4SwapParams): `0x${string}` {
  const poolKey = getPoolKey();
  const zeroForOne = true; // USDC.e → USDC (currency0 → currency1)

  // 1) SWAP_EXACT_IN_SINGLE params
  const swapParams = encodeAbiParameters(exactInputSingleAbi, [
    poolKey,
    zeroForOne,
    params.amountIn,
    params.minAmountOut,
    "0x",
  ]);

  // 2) SETTLE_ALL: (address currency, uint256 maxAmount). Input token = USDC.e = currency0.
  const settleParams = encodeAbiParameters(
    [
      { name: "currency", type: "address" },
      { name: "maxAmount", type: "uint256" },
    ],
    [poolKey.currency0, params.amountIn]
  );

  // 3) TAKE_ALL: (address currency, uint256 minAmount). Output token = USDC = currency1.
  const takeParams = encodeAbiParameters(
    [
      { name: "currency", type: "address" },
      { name: "minAmount", type: "uint256" },
    ],
    [poolKey.currency1, params.minAmountOut]
  );

  // actions = 0x06, 0x0c, 0x0f (SWAP_EXACT_IN_SINGLE, SETTLE_ALL, TAKE_ALL)
  const actions = "0x060c0f" as `0x${string}`;
  const paramsEncoded = [swapParams, settleParams, takeParams] as `0x${string}`[];

  return encodeAbiParameters(
    [
      { name: "actions", type: "bytes" },
      { name: "params", type: "bytes[]" },
    ],
    [actions, paramsEncoded]
  ) as `0x${string}`;
}

/**
 * Builds [approveTx, swapTx] for USDC.e → Native USDC. Recipient = Safe address.
 * Execute via relayClient.execute(txs, "Rebalance to USDC").
 */
export function createUsdcEToUsdcSwapTx(
  amountIn: bigint,
  minAmountOut: bigint,
  recipient: `0x${string}`
): SafeTransaction[] {
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const approveTx: SafeTransaction = {
    to: USDC_E_CONTRACT_ADDRESS,
    operation: OperationType.Call,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [UNISWAP_V4_UNIVERSAL_ROUTER, amountIn],
    }),
    value: "0",
  };

  const v4Input = encodeV4SwapCommand({ amountIn, minAmountOut, recipient });
  const swapTx: SafeTransaction = {
    to: UNISWAP_V4_UNIVERSAL_ROUTER,
    operation: OperationType.Call,
    data: encodeFunctionData({
      abi: universalRouterAbi,
      functionName: "execute",
      args: ["0x10" as `0x${string}`, [v4Input], deadline],
    }),
    value: "0",
  };

  return [approveTx, swapTx];
}
