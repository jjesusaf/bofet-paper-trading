/**
 * Builds Universal Router execute(commands, inputs, deadline) payload for EOA USDC.e → USDC swap
 * using @uniswap/v4-sdk and @uniswap/universal-router-sdk (same as swap_test/swap_EOA.ts).
 * Use this payload with viem encodeFunctionData(execute, [commands, inputs, deadline]).
 */

import { Actions, V4Planner } from "@uniswap/v4-sdk";
import type { SwapExactInSingle } from "@uniswap/v4-sdk";
import { CommandType, RoutePlanner } from "@uniswap/universal-router-sdk";
import {
  USDC_E_CONTRACT_ADDRESS,
  USDC_CONTRACT_ADDRESS,
} from "@/constants/tokens";
import { USDC_E_TO_USDC_POOL_FEE } from "@/constants/uniswap";

const ZERO_HOOKS = "0x0000000000000000000000000000000000000000";

function ensureHex(s: string): `0x${string}` {
  if (s.startsWith("0x")) return s as `0x${string}`;
  return `0x${s}` as `0x${string}`;
}

export interface BuildEoaExecutePayloadParams {
  amountIn: bigint;
  minAmountOut: bigint;
}

export interface EoaExecutePayload {
  commands: `0x${string}`;
  inputs: [`0x${string}`];
}

/**
 * Builds (commands, inputs) for Universal Router execute() using V4Planner + RoutePlanner.
 * Mirrors swap_test/swap_EOA.ts lines 158–211 so encoding matches the working script.
 */
export function buildEoaUsdceToUsdcExecutePayload(
  params: BuildEoaExecutePayloadParams
): EoaExecutePayload {
  const { amountIn, minAmountOut } = params;

  const poolKey = {
    currency0: USDC_E_CONTRACT_ADDRESS,
    currency1: USDC_CONTRACT_ADDRESS,
    fee: USDC_E_TO_USDC_POOL_FEE,
    tickSpacing: 1,
    hooks: ZERO_HOOKS,
  };

  const config: SwapExactInSingle = {
    poolKey,
    zeroForOne: true,
    amountIn: amountIn.toString(),
    amountOutMinimum: minAmountOut.toString(),
    hookData: "0x00",
  };

  const v4Planner = new V4Planner();
  v4Planner.addAction(Actions.SWAP_EXACT_IN_SINGLE, [config]);
  v4Planner.addAction(Actions.SETTLE_ALL, [
    config.poolKey.currency0,
    config.amountIn,
  ]);
  v4Planner.addAction(Actions.TAKE_ALL, [
    config.poolKey.currency1,
    config.amountOutMinimum,
  ]);

  const encodedActions = v4Planner.finalize();

  const routePlanner = new RoutePlanner();
  routePlanner.addCommand(CommandType.V4_SWAP, [
    v4Planner.actions,
    v4Planner.params,
  ]);

  return {
    commands: ensureHex(routePlanner.commands),
    inputs: [ensureHex(encodedActions)],
  };
}
