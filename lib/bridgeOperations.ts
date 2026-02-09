/**
 * Simple wrapper for Polymarket bridge using existing functions.
 *
 * This file orchestrates the USDC → USDC.e bridge flow using:
 * - fetchDepositAddress: from useBridgeDeposit (with Redis cache)
 * - waitForBridgeCompletion: from utils/bridge (status polling)
 *
 * Flow:
 * 1. Get deposit address (cached or fetch from Polymarket API)
 * 2. Safe sends USDC to that address
 * 3. Polling until bridge completes (status = "completed")
 * 4. Return result
 */

import type Safe from "@safe-global/protocol-kit";
import { SigningMethod } from "@safe-global/types-kit";
import { MetaTransactionData, OperationType } from "@safe-global/types-kit";
import { encodeFunctionData, erc20Abi } from "viem";
import { USDC_CONTRACT_ADDRESS, USDC_E_CONTRACT_ADDRESS } from "@/constants/tokens";
import { waitForBridgeCompletion, type BridgeStatusResult, fetchBridgeWithdrawAddress } from "@/utils/bridge";
import { HOOKS_ZERO } from "@/constants/fullConversion";

/**
 * Options for the bridge.
 */
export interface BridgeOptions {
  /** Callback when bridge status changes */
  onStatusChange?: (result: BridgeStatusResult) => void;
  /** Callback when it takes longer than 30 seconds */
  onExtendedWait?: (elapsedSeconds: number) => void;
  /** Polling interval (ms). Default: 3000 (3 seconds) */
  pollIntervalMs?: number;
  /** Maximum timeout (ms). Default: 300000 (5 minutes) */
  timeoutMs?: number;
}

/**
 * Bridge result.
 */
export interface BridgeResult {
  /** Hash of the transaction that sent USDC to the bridge */
  txHash: string;
  /** Deposit address used */
  depositAddress: string;
  /** Final bridge result (completed status) */
  bridgeStatus: BridgeStatusResult;
}

/**
 * Ejecuta el flujo completo de bridge USDC → USDC.e.
 *
 * Pasos:
 * 1. Obtiene dirección de depósito del bridge (usando fetchDepositAddress)
 * 2. Crea transacción del Safe para enviar USDC a esa dirección
 * 3. Ejecuta la transacción del Safe
 * 4. Espera (polling) hasta que el bridge complete la conversión
 * 5. Retorna resultado con txHash y status
 *
 * @param safeProtocolKit - Instancia de Safe Protocol Kit
 * @param fetchDepositAddress - Función para obtener dirección del bridge (de useBridgeDeposit)
 * @param usdcAmount - Cantidad de USDC a enviar (bigint, 6 decimales)
 * @param options - Opciones de polling y callbacks
 * @returns Resultado del bridge con txHash y status
 *
 * @example
 * ```typescript
 * const { fetchDepositAddress } = useBridgeDeposit(safeAddress);
 *
 * const result = await executeBridgeFlow(
 *   safeProtocolKit,
 *   fetchDepositAddress,
 *   parseUnits("2", 6), // 2 USDC
 *   {
 *     onStatusChange: (status) => {
 *       console.log("Bridge status:", status.kind);
 *     },
 *     onExtendedWait: (seconds) => {
 *       console.log(`Esperando ${seconds}s...`);
 *     }
 *   }
 * );
 *
 * console.log("Bridge completed:", result.txHash);
 * ```
 */
export async function executeBridgeFlow(
  safeProtocolKit: Safe,
  fetchDepositAddress: () => Promise<string>,
  usdcAmount: bigint,
  options: BridgeOptions = {}
): Promise<BridgeResult> {

  // STEP 1: Obtener dirección de depósito del bridge
  const depositAddress = await fetchDepositAddress();

  // Normalizar dirección (asegurar que empiece con 0x)
  const recipient = depositAddress.startsWith("0x")
    ? (depositAddress as `0x${string}`)
    : (`0x${depositAddress}` as `0x${string}`);

  // STEP 2: Crear transacción del Safe para enviar USDC al bridge

  const transferData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, usdcAmount],
  });

  const bridgeTx: MetaTransactionData = {
    to: USDC_CONTRACT_ADDRESS,
    value: "0",
    data: transferData,
    operation: OperationType.Call,
  };

  // STEP 3: Ejecutar transacción del Safe

  // IMPORTANT: Pass non-zero safeTxGas to avoid GS013 error
  // Let Magic/RPC calculate gas price automatically for current network conditions
  let safeTransaction = await safeProtocolKit.createTransaction({
    transactions: [bridgeTx],
    options: {
      safeTxGas: "200000", // Non-zero gas limit
      baseGas: "0",
      gasPrice: "0", // Let RPC calculate dynamically
      gasToken: HOOKS_ZERO,
      refundReceiver: HOOKS_ZERO,
    },
  });

  // Sign with ETH_SIGN_TYPED_DATA_V4 for Magic compatibility
  safeTransaction = await safeProtocolKit.signTransaction(
    safeTransaction,
    SigningMethod.ETH_SIGN_TYPED_DATA_V4
  );

  // Execute transaction (gas price calculated automatically)
  const txResponse = await safeProtocolKit.executeTransaction(safeTransaction);

  const bridgeStatus = await waitForBridgeCompletion(depositAddress, {
    pollIntervalMs: options.pollIntervalMs,
    timeoutMs: options.timeoutMs,
    onStatusChange: options.onStatusChange,
    onExtendedWait: options.onExtendedWait,
  });

  return {
    txHash: txResponse.hash,
    depositAddress,
    bridgeStatus,
  };
}

/**
 * Ejecuta el flujo completo de withdraw: USDC.e → USDC (bridge reverso).
 *
 * Pasos:
 * 1. Obtiene dirección de retiro del bridge (usando fetchBridgeWithdrawAddress)
 * 2. Crea transacción del Safe para enviar USDC.e a esa dirección
 * 3. Ejecuta la transacción del Safe
 * 4. Espera (polling) hasta que el bridge complete la conversión
 * 5. Retorna resultado con txHash y status
 *
 * @param safeProtocolKit - Instancia de Safe Protocol Kit
 * @param usdceAmount - Cantidad de USDC.e a enviar (bigint, 6 decimales)
 * @param toChainId - Chain ID destino (ej: "137" para Polygon)
 * @param toTokenAddress - Dirección del token destino (USDC nativo)
 * @param recipientAddr - Dirección que recibirá los tokens (usualmente la Safe)
 * @param options - Opciones de polling y callbacks
 * @returns Resultado del withdraw con txHash y status
 *
 * @example
 * ```typescript
 * const result = await executeWithdrawFlow(
 *   safeProtocolKit,
 *   parseUnits("10", 6), // 10 USDC.e
 *   "137", // Polygon
 *   "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC nativo
 *   safeAddress, // Recipient
 *   {
 *     onStatusChange: (status) => {
 *       console.log("Withdraw status:", status.kind);
 *     }
 *   }
 * );
 *
 * console.log("Withdraw completed:", result.txHash);
 * ```
 */
export async function executeWithdrawFlow(
  safeProtocolKit: Safe,
  usdceAmount: bigint,
  toChainId: string,
  toTokenAddress: string,
  recipientAddr: string,
  options: BridgeOptions = {}
): Promise<BridgeResult> {
  console.log(
    `[WithdrawOps] Starting withdraw flow for ${usdceAmount.toString()} USDC.e...`
  );

  // STEP 1: Obtener dirección de retiro del bridge
  console.log("[WithdrawOps] Step 1: Fetching withdrawal address...");
  const safeAddress = await safeProtocolKit.getAddress();
  const withdrawResponse = await fetchBridgeWithdrawAddress(
    safeAddress,
    toChainId,
    toTokenAddress,
    recipientAddr
  );
  const withdrawAddress = withdrawResponse.address.evm;
  console.log(`[WithdrawOps] Withdrawal address obtained: ${withdrawAddress}`);

  // Normalizar dirección (asegurar que empiece con 0x)
  const recipient = withdrawAddress.startsWith("0x")
    ? (withdrawAddress as `0x${string}`)
    : (`0x${withdrawAddress}` as `0x${string}`);

  // STEP 2: Crear transacción del Safe para enviar USDC.e al bridge
  console.log("[WithdrawOps] Step 2: Creating Safe transaction...");

  const transferData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [recipient, usdceAmount],
  });

  const withdrawTx: MetaTransactionData = {
    to: USDC_E_CONTRACT_ADDRESS,
    value: "0",
    data: transferData,
    operation: OperationType.Call,
  };

  // STEP 3: Ejecutar transacción del Safe
  console.log("[WithdrawOps] Step 3: Executing Safe transaction...");

  let safeTransaction = await safeProtocolKit.createTransaction({
    transactions: [withdrawTx],
    options: {
      safeTxGas: "200000", // Non-zero gas limit
      baseGas: "0",
      gasPrice: "0", // Let RPC calculate dynamically
      gasToken: HOOKS_ZERO,
      refundReceiver: HOOKS_ZERO,
    },
  });

  // Sign with ETH_SIGN_TYPED_DATA_V4 for Magic compatibility
  safeTransaction = await safeProtocolKit.signTransaction(
    safeTransaction,
    SigningMethod.ETH_SIGN_TYPED_DATA_V4
  );

  // Execute transaction (gas price calculated automatically)
  const txResponse = await safeProtocolKit.executeTransaction(safeTransaction);

  console.log(`[WithdrawOps] Safe transaction sent: ${txResponse.hash}`);

  // No need to wait for tx confirmation here - the bridge polling below will handle it
  // If we wait here, it can timeout on slow networks
  console.log("[WithdrawOps] Transaction submitted, proceeding to bridge polling...");

  // STEP 4: Polling - esperar que el bridge complete
  console.log("[WithdrawOps] Step 4: Waiting for bridge completion...");

  const bridgeStatus = await waitForBridgeCompletion(withdrawAddress, {
    pollIntervalMs: options.pollIntervalMs,
    timeoutMs: options.timeoutMs,
    onStatusChange: options.onStatusChange,
    onExtendedWait: options.onExtendedWait,
  });

  console.log("[WithdrawOps] Withdraw completed ✅");

  return {
    txHash: txResponse.hash,
    depositAddress: withdrawAddress,
    bridgeStatus,
  };
}
