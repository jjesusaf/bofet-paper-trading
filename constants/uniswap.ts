/**
 * Uniswap V4 Polygon Mainnet — used for USDC.e → USDC rebalance / CLAIM REWARD.
 * Pool: https://app.uniswap.org/explore/pools/polygon/0x6ddffaf5ef8beab8830c0583557fa90f0307a4478d6198c367b59c40082e0baf
 */

export const UNISWAP_V4_POOL_MANAGER =
  "0x67366782805870060151383f4bbff9dab53e5cd6" as const;

export const UNISWAP_V4_UNIVERSAL_ROUTER =
  "0x1095692a6237d83c6a72f3f5efedb9a670c49223" as const;

export const UNISWAP_V4_QUOTER =
  "0xb3d5c3dfc3a7aebff71895a7191796bffc2c81b9" as const;

export const UNISWAP_V4_PERMIT2 =
  "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

/** Pool fee for USDC.e → Native USDC (0.002% = 20 pips). Stablecoin pool. */
export const USDC_E_TO_USDC_POOL_FEE = 20;
