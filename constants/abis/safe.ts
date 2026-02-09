/**
 * Minimal Gnosis Safe ABI for readContract (getOwners).
 * Used by useRebalanceToUsdc for optional EOA-owner check.
 */

export const safeAbi = [
  {
    inputs: [],
    name: "getOwners",
    outputs: [
      { internalType: "address[]", name: "", type: "address[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
