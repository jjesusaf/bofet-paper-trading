/**
 * Uniswap V4 ABIs and types for Universal Router execute and V4 swap encoding.
 * Used by rebalance_roadmap and roadmap_CLAIMREWARD (USDC.e → USDC).
 * Ref: Uniswap Universal Router technical-reference, v4 SDK Actions.
 */

import type { Abi } from "viem";

/**
 * Minimal Universal Router ABI for execute(commands, inputs, deadline).
 * Used to encode SafeTransaction data via encodeFunctionData in Phase 2.
 */
export const universalRouterAbi = [
  {
    inputs: [
      { name: "commands", type: "bytes" },
      { name: "inputs", type: "bytes[]" },
      { name: "deadline", type: "uint256" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const satisfies Abi;

/** Universal Router command bytes. V4_SWAP = 0x10 (docs.uniswap.org/contracts/universal-router/technical-reference). */
export const Commands = {
  V4_SWAP: 0x10,
} as const;

/** Uniswap v4 SDK Actions for V4_SWAP inputs (utils/v4Planner.ts). */
export const Actions = {
  SWAP_EXACT_IN_SINGLE: 6,
  SETTLE_ALL: 12,
  TAKE_ALL: 15,
} as const;

/**
 * Uniswap V4 PoolKey. currency0 < currency1 by address.
 * For USDC.e/USDC: currency0 = Native USDC, currency1 = USDC.e.
 */
export interface PoolKey {
  currency0: `0x${string}`;
  currency1: `0x${string}`;
  fee: number;
  tickSpacing: number;
  hooks: `0x${string}`;
}

/**
 * V4 Quoter ABI for quoteExactInputSingle. Not a view — use simulateContract.
 * QuoteExactSingleParams: (PoolKey poolKey, bool zeroForOne, uint128 exactAmount, bytes hookData).
 * Includes QuoterRevert.UnexpectedRevertBytes so viem can decode reverts (selector 0x6190b2b0).
 */
export const v4QuoterAbi = [
  {
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
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
          { name: "exactAmount", type: "uint128" },
          { name: "hookData", type: "bytes" },
        ],
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    type: "error",
    name: "UnexpectedRevertBytes",
    inputs: [{ name: "reason", type: "bytes" }],
  },
] as const satisfies Abi;

/**
 * Permit2 AllowanceTransfer ABI for EOA USDC.e → USDC swap.
 * Ref: swap_test/swap_EOA.ts (lines 19–22).
 */
export const permit2Abi = [
  {
    inputs: [
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "token", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [
      { name: "amount", type: "uint160" },
      { name: "expiration", type: "uint48" },
      { name: "nonce", type: "uint48" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const satisfies Abi;
