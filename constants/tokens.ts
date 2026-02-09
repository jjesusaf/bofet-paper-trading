export const USDC_E_CONTRACT_ADDRESS =
  "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" as const;

export const USDC_E_DECIMALS = 6;

export const USDC_CONTRACT_ADDRESS =
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" as const;

export const USDC_DECIMALS = 6;

export const CTF_CONTRACT_ADDRESS =
  "0x4d97dcd97ec945f40cf65f87097ace5ea0476045" as const;

export const CTF_EXCHANGE_ADDRESS =
  "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E" as const;

export const NEG_RISK_CTF_EXCHANGE_ADDRESS =
  "0xC5d563A36AE78145C45a50134d48A1215220f80a" as const;

export const NEG_RISK_ADAPTER_ADDRESS =
  "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296" as const;

/**
 * BuyGas contract - Convierte USDC.e a POL para auto-financiar el Safe.
 * El Safe envía USDC.e a este contrato y recibe POL para pagar gas.
 *
 * Flujo:
 * 1. Safe aprueba USDC.e al contrato buyGas
 * 2. Safe llama buyGas(amount)
 * 3. Contrato hace swap interno USDC.e → POL en un DEX
 * 4. Safe recibe POL directamente
 *
 * Ejemplo: 0.2 USDC.e → ~0.12 POL (suficiente para varias transacciones)
 */
export const BUYGAS_CONTRACT_ADDRESS =
  "0x2636A27d0b5D3082Dc698a7D24D26dFC0F4eaFbe" as const;

/**
 * Cantidad de USDC.e que se usa para comprar POL en cada conversión completa.
 *
 * Por qué 0.2 USDC.e:
 * - A precio actual POL ≈ $0.30, obtienes ~0.12 POL
 * - Cada transacción del Safe cuesta ~0.02-0.04 POL
 * - Con 0.12 POL tienes suficiente para 3-6 transacciones
 * - El Safe se auto-financia sin necesidad de depositar POL manualmente
 */
export const BUYGAS_USDC_E_AMOUNT = "0.2";

/**
 * Polygon chain ID for Polymarket bridge operations.
 * Used for withdraw flow (USDC.e → USDC).
 */
export const POLYGON_CHAIN_ID = "137" as const;

/**
 * BuyUsdce contract - Convierte USDC nativo a USDC.e para el Safe.
 * El Safe envía USDC a este contrato y recibe USDC.e con ratio 1:0.99 (1% fee).
 *
 * Flujo:
 * 1. Safe aprueba USDC al contrato BuyUsdce
 * 2. Safe llama swapUsdcForUsdCe(amount)
 * 3. Contrato intercambia USDC → USDC.e
 * 4. Safe recibe USDC.e directamente
 */
export const BUY_USDCE_CONTRACT_ADDRESS =
  "0x115869E36afAc1ddaE28C42fc8050A2F6fc25a11" as const;

/**
 * SendGas contract - Permite al EOA reclamar 2 POL gratis (una vez por wallet).
 * Un relayer server-side paga el gas; el EOA solo firma un mensaje EIP-712.
 *
 * Flujo:
 * 1. EOA firma EIP-712 ClaimGasFor(recipient, deadline)
 * 2. Relayer ejecuta claimGasFor() on-chain
 * 3. EOA recibe 2 POL
 */
export const SEND_GAS_CONTRACT_ADDRESS =
  "0x2419bC7ace852cBCCE23Dc6C65712168463222b3" as const;
