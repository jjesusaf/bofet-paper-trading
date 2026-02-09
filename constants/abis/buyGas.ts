/**
 * ABI completo del contrato BuyGas (Polygon Mainnet).
 * Address: 0x2636A27d0b5D3082Dc698a7D24D26dFC0F4eaFbe
 *
 * Funcionalidad principal:
 * - buyGas(uint256 usdcAmount): Convierte USDC.e → POL usando oracle de Chainlink
 * - El usuario aprueba USDC.e al contrato
 * - El contrato toma USDC.e y envía POL al usuario
 * - Usa precio de oracle POL/USD para calcular cuánto POL enviar
 * - Cobra un fee (FEE_BPS) configurable por el owner
 *
 * Eventos importantes:
 * - GasPurchased: Se emite cuando se compra POL exitosamente
 * - PolDeposited: El owner depositó POL al contrato
 * - PolWithdrawn: El owner retiró POL del contrato
 *
 * Errores custom:
 * - InsufficientPolBalance: El contrato no tiene suficiente POL
 * - StaleOraclePrice: El precio del oracle está desactualizado
 * - ZeroUsdcEAmount: Intentaste comprar con 0 USDC.e
 */

import type { Abi } from "viem";

export const buyGasAbi = [
  {
    inputs: [
      { internalType: "address", name: "_usdcE", type: "address" },
      { internalType: "address", name: "_polUsdOracle", type: "address" },
      { internalType: "address", name: "_owner", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "InsufficientPolBalance",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidPrice",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint256", name: "blockTimestamp", type: "uint256" },
    ],
    name: "OracleTimeInFuture",
    type: "error",
  },
  {
    inputs: [],
    name: "OracleUpdateZero",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    inputs: [],
    name: "PolTransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "ReentrancyGuardReentrantCall",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint256", name: "maxStaleness", type: "uint256" },
    ],
    name: "StaleOraclePrice",
    type: "error",
  },
  {
    inputs: [],
    name: "TransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "UsdcETransferFailed",
    type: "error",
  },
  {
    inputs: [],
    name: "ZeroUsdcEAmount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: false, internalType: "uint256", name: "usdcAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "polAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "price", type: "uint256" },
    ],
    name: "GasPurchased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" }],
    name: "PolDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "PolWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "newStaleness", type: "uint256" }],
    name: "StalenessUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "token", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "TokenSwept",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: false, internalType: "uint256", name: "amount", type: "uint256" }],
    name: "UsdcEWithdrawn",
    type: "event",
  },
  {
    inputs: [],
    name: "FEE_BPS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "POL_USD_ORACLE",
    outputs: [{ internalType: "contract IAggregatorV3", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "USDC_E",
    outputs: [{ internalType: "contract IERC20", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "usdcAmount", type: "uint256" }],
    name: "buyGas",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "depositPol",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "maxStalenessSeconds",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newStaleness", type: "uint256" }],
    name: "setMaxStaleness",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "address", name: "to", type: "address" },
    ],
    name: "sweepToken",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "to", type: "address" }],
    name: "withdrawAllPol",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "to", type: "address" },
    ],
    name: "withdrawUsdc",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
] as const satisfies Abi;
