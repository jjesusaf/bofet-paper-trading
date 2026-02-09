# Changes: USDC.e → USDC (Swap via Uniswap)

Summary of changes made to add the navbar "Swap to USDC" button that swaps all EOA USDC.e to native USDC via Uniswap V4 (Permit2 + Universal Router). The existing "Convert to USDC.e" button and Polygon Bridge flow were not modified.

---

## 1. Constants / ABIs

### `constants/abis/uniswapV4.ts`
- **Added** `permit2Abi`: Permit2 AllowanceTransfer ABI for EOA swap (ref: swap_test/swap_EOA.ts).
  - `approve(token, spender, amount, expiration)` — `uint160` amount, `uint48` expiration.
  - `allowance(owner, token, spender)` — returns `(uint160 amount, uint48 expiration, uint48 nonce)`.

---

## 2. New hook

### `hooks/useEoaUsdceToUsdcSwap.ts` (new file)
- **Purpose:** One-shot “swap all EOA USDC.e → native USDC” for the navbar.
- **Inputs:** `useWallet()` (eoaAddress, walletClient, publicClient), `usePolygonBalances(eoaAddress)` (rawUsdcBalance = USDC.e), `useQueryClient()`.
- **Flow:**
  1. Guard: return early if no eoaAddress or USDC.e balance ≤ 0.
  2. ERC20: if `allowance(EOA, Permit2) < amountIn`, send `USDC.e.approve(Permit2, maxUint256)`; wait for receipt (2 min timeout).
  3. Permit2: if `allowance(EOA, USDC.e, Universal Router)` is insufficient or expired, send `Permit2.approve(USDC.e, Universal Router, maxUint160, deadline)`; wait for receipt.
  4. Quote: `getSwapQuote(amountIn, { publicClient })`; `minAmountOut = amountOut * (10000 - 200) / 10000` (2% slippage).
  5. Encode: `encodeV4SwapCommand({ amountIn, minAmountOut, recipient: eoaAddress })`; `execute("0x10", [v4Input], deadline)`.
  6. Execute: send Universal Router `execute` tx with EIP-1559 gas and explicit nonce (`getTransactionCount(..., "pending")`); wait for receipt with 2 min timeout (tx hash in error on timeout).
  7. On success: invalidate `["usdcBalance", eoaAddress]` and `["nativeUsdcBalance", eoaAddress]`.
- **State:** `isSwapping`, `error`.
- **Return:** `{ swapUsdceToUsdc, isSwapping, error, eoaUsdcBalance }`.
- **Reused (no changes):** `getSwapQuote`, `encodeV4SwapCommand`, `getPoolKey` from utils; `getPolygonEip1559GasParams`, `getPublicPolygonClient` from utils/polygonGas; `universalRouterAbi`, `permit2Abi` from constants/abis/uniswapV4; token and Uniswap addresses from constants/tokens and constants/uniswap.

---

## 3. Navbar

### `components/Navbar/index.tsx`
- **Import:** `useEoaUsdceToUsdcSwap`.
- **Hook:** `const { swapUsdceToUsdc, isSwapping, error: swapError } = useEoaUsdceToUsdcSwap();`
- **Handler:** `handleSwapUsdceToUsdcClick` — calls `swapUsdceToUsdc()` in try/catch; errors shown via `swapError`.
- **Button (new):** In the same row as "Convert to USDC.e", "Send USDC.e to Safe", "Withdraw to wallet":
  - Label: "Swap to USDC" (or dict `navbar.swapToUsdc`).
  - Disabled: `isSwapping || (eoaRawUsdcBalance ?? 0) <= 0`.
  - Style: `btn btn-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-200`.
  - Tooltip / aria: dict keys `swapToUsdcTooltip`, `swapToUsdcErrorNoBalance`, `swapToUsdcSending`.
- **Error:** `swapError?.message` shown next to `convertError`, `transferError`, `safeToEoaError` (truncate, red text, full message in title).
- **Not changed:** "Convert to USDC.e" button, `useEoaBridgeConvert`, or any bridge-related code.

---

## 4. Dictionaries

### `app/[lang]/dictionaries/en.json`
- Under `navbar`:
  - `swapToUsdc`: "Swap to USDC"
  - `swapToUsdcSending`: "Swapping..."
  - `swapToUsdcTooltip`: "Swap all USDC.e in your wallet to native USDC"
  - `swapToUsdcErrorNoBalance`: "No USDC.e in your wallet"

### `app/[lang]/dictionaries/es.json`
- Under `navbar`:
  - `swapToUsdc`: "Cambiar a USDC"
  - `swapToUsdcSending`: "Cambiando..."
  - `swapToUsdcTooltip`: "Cambiar todo el USDC.e de tu billetera a USDC nativo"
  - `swapToUsdcErrorNoBalance`: "No hay USDC.e en tu billetera"

### `providers/dictionary-provider.tsx`
- **Type:** In `Dictionary` type, under `navbar`, added optional:
  - `swapToUsdc?: string`
  - `swapToUsdcSending?: string`
  - `swapToUsdcTooltip?: string`
  - `swapToUsdcErrorNoBalance?: string`

---

## 5. Files touched (summary)

| File | Change |
|------|--------|
| `constants/abis/uniswapV4.ts` | Added `permit2Abi`. |
| `hooks/useEoaUsdceToUsdcSwap.ts` | **New** — EOA USDC.e → USDC swap hook. |
| `components/Navbar/index.tsx` | Import hook; add "Swap to USDC" button, handler, swapError display. |
| `app/[lang]/dictionaries/en.json` | Add navbar swap keys (en). |
| `app/[lang]/dictionaries/es.json` | Add navbar swap keys (es). |
| `providers/dictionary-provider.tsx` | Add optional navbar keys to `Dictionary` type. |

**Not modified:** `useEoaBridgeConvert`, `utils/bridge.ts`, `FundSafeSection`, `useAutoConvert`, or any USDC → USDC.e (Polygon Bridge) flow.
