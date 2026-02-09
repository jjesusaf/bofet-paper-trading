/**
 * Utilidades para opciones de transacciones de Safe en Polygon.
 *
 * Safe Protocol Kit acepta opciones custom para executeTransaction.
 * Estas opciones controlan cómo se ejecuta la transacción on-chain:
 * - gasPrice: Precio del gas en Wei
 * - from: Dirección que firma/ejecuta (el EOA, no el Safe)
 * - maxFeePerGas/maxPriorityFeePerGas: Para EIP-1559 (no usado en Polygon)
 */

import { POLYGON_GAS_PRICE_WEI } from "@/constants/fullConversion";

/**
 * Opciones de transacción para Safe Protocol Kit.
 */
export interface Web3TransactionOptions {
  from?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Interfaz mínima para el provider (Magic o cualquier EIP-1193).
 */
export interface Eip1193Provider {
  /** Dirección del EOA conectado */
  selectedAddress?: string;
  /** Método request estándar de EIP-1193 */
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

/**
 * Genera opciones de transacción optimizadas para Polygon.
 *
 * Esta función replica el patrón del código Deno:
 * - Usa gas price fijo de 25 Gwei (rápido y económico en Polygon)
 * - Desactiva EIP-1559 (maxFeePerGas/maxPriorityFeePerGas)
 * - Especifica el EOA que ejecuta (from)
 *
 * @param provider - Provider de Magic o cualquier EIP-1193
 * @returns Opciones para executeTransaction
 *
 * @example
 * ```typescript
 * const magic = getMagic();
 * const txResponse = await safeProtocolKit.executeTransaction(
 *   safeTransaction,
 *   getPolygonTxOptions(magic.rpcProvider)
 * );
 * ```
 */
export function getPolygonTxOptions(
  provider: Eip1193Provider
): Web3TransactionOptions {
  return {
    from: provider.selectedAddress,
    gasPrice: POLYGON_GAS_PRICE_WEI,
    maxFeePerGas: undefined, // Desactivar EIP-1559
    maxPriorityFeePerGas: undefined, // Desactivar EIP-1559
  };
}
