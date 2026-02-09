/**
 * ABI mínimo del contrato SendGas (Polygon Mainnet).
 * Address: 0x2419bC7ace852cBCCE23Dc6C65712168463222b3
 *
 * Funcionalidad:
 * - claimGasFor(recipient, deadline, signature): Relayer ejecuta claim para un EOA
 * - hasClaimedGas(address): Verifica si una wallet ya reclamó
 * - remainingClaims(): Cantidad de claims disponibles en el contrato
 */

import type { Abi } from "viem";

export const sendGasAbi = [
  {
    inputs: [
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "claimGasFor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "hasClaimedGas",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "remainingClaims",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const satisfies Abi;
