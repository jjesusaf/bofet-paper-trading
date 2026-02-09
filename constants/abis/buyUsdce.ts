/**
 * ABI mínimo del contrato BuyUsdce (Polygon Mainnet).
 * Address: 0x115869E36afAc1ddaE28C42fc8050A2F6fc25a11
 *
 * Funcionalidad principal:
 * - swapUsdcForUsdCe(uint256 usdcAmount): Convierte USDC nativo → USDC.e
 * - Ratio 1:0.99 (1% fee)
 * - El usuario aprueba USDC al contrato
 * - El contrato toma USDC y envía USDC.e al usuario
 */

import type { Abi } from "viem";

export const buyUsdceAbi = [
  {
    inputs: [{ internalType: "uint256", name: "usdcAmount", type: "uint256" }],
    name: "swapUsdcForUsdCe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const satisfies Abi;
