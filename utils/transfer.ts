import {
  OperationType,
  SafeTransaction,
} from "@polymarket/builder-relayer-client";
import { encodeFunctionData, erc20Abi, getAddress } from "viem";
import {
  USDC_CONTRACT_ADDRESS,
  USDC_E_CONTRACT_ADDRESS,
} from "@/constants/tokens";

export interface TransferParams {
  recipient: `0x${string}`;
  amount: bigint;
}

/** Payload for an EOA to sign/send (to, data, value). */
export interface EoaTransferTx {
  to: `0x${string}`;
  data: `0x${string}`;
  value: bigint;
}

/**
 * Builds the transaction payload for an EOA to send native USDC to an address
 * (e.g. Polymarket bridge deposit address).
 * Ref: swap_gnosis_v2.ts L87–92, L117–128.
 */
export function buildEoaTransferUsdcToAddress(
  recipient: string,
  amount: bigint
): EoaTransferTx {
  const to = getAddress(recipient) as `0x${string}`;
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amount],
  });
  return {
    to: USDC_CONTRACT_ADDRESS as `0x${string}`,
    data,
    value: BigInt(0),
  };
}

/**
 * Builds the transaction payload for an EOA to send USDC.e to the user's Safe.
 * Ref: swap_gnosis_v2.ts L87–92, L163–177.
 */
export function buildEoaTransferUsdceToSafe(
  safeAddress: string,
  amount: bigint
): EoaTransferTx {
  const to = getAddress(safeAddress) as `0x${string}`;
  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amount],
  });
  return {
    to: USDC_E_CONTRACT_ADDRESS as `0x${string}`,
    data,
    value: BigInt(0),
  };
}

export const createUsdcTransferTx = (
  params: TransferParams
): SafeTransaction => {
  const { recipient, amount } = params;

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, amount],
  });

  return {
    to: USDC_E_CONTRACT_ADDRESS,
    operation: OperationType.Call,
    data,
    value: "0",
  };
};

/**
 * Creates a Safe transaction for transferring native USDC.
 * Used for sending USDC to the bridge deposit address for conversion to USDC.e.
 *
 * @param params - TransferParams (recipient, amount in smallest units)
 * @returns SafeTransaction ready for execution via RelayClient
 */
export const createNativeUsdcTransferTx = (
  params: TransferParams
): SafeTransaction => {
  const { recipient, amount } = params;

  const data = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, amount],
  });

  return {
    to: USDC_CONTRACT_ADDRESS,
    operation: OperationType.Call,
    data,
    value: "0",
  };
};
