/**
 * Configuración del flujo completo de conversión USDC → USDC.e → USDC.
 *
 * Este flujo consta de 3 pasos:
 * 1. Bridge USDC → USDC.e (vía Polymarket bridge)
 * 2. Buy Gas: 0.2 USDC.e → POL (auto-funding del Safe)
 * 3. Swap USDC.e → USDC + cobro de fee 1%
 */

/**
 * Fee que se cobra en cada conversión (en basis points).
 * - 100 BPS = 1%
 * - 50 BPS = 0.5%
 * - 200 BPS = 2%
 *
 * El fee se cobra DESPUÉS del buy gas, ANTES del swap:
 * Ejemplo con 2 USDC inicial:
 * 1. Bridge: 2.00 USDC → 1.97 USDC.e (bridge fee)
 * 2. Buy gas: 1.97 - 0.20 = 1.77 USDC.e
 * 3. Fee: 1.77 * 1% = 0.0177 USDC.e → FEE_RECIPIENT_ADDRESS
 * 4. Swap: 1.7523 USDC.e → ~1.75 USDC
 */
export const FEE_BPS = 100; // 1%

/**
 * Slippage máximo aceptable para el swap USDC.e → USDC (en basis points).
 * - 200 BPS = 2%
 * - 100 BPS = 1%
 * - 50 BPS = 0.5%
 *
 * Qué significa:
 * - Si el quoter dice "recibirás 1.00 USDC"
 * - Con 2% slippage, aceptamos mínimo 0.98 USDC
 * - Si el swap real da menos de 0.98 USDC, la transacción falla
 *
 * Por qué 2%:
 * - Pool USDC.e/USDC es muy estable (ambos son ~$1)
 * - Fee del pool es solo 0.002%
 * - 2% es generoso para proteger contra edge cases
 */
export const SLIPPAGE_BPS = 200; // 2%

/**
 * Intervalo de polling para verificar si llegó USDC.e del bridge (ms).
 * - 10,000 ms = 10 segundos
 *
 * Flujo:
 * 1. Safe envía USDC al bridge
 * 2. Cada 10 segundos, verifica balance de USDC.e
 * 3. Cuando balance aumenta, continúa con step 2
 *
 * Por qué 10 segundos:
 * - El bridge tarda ~30-60 segundos
 * - Verificar muy seguido consume RPC requests innecesarios
 * - 10 segundos es buen balance entre rapidez y eficiencia
 */
export const BRIDGE_POLL_INTERVAL_MS = 10_000; // 10 segundos

/**
 * Timeout máximo para esperar USDC.e del bridge (ms).
 * - 300,000 ms = 5 minutos
 *
 * Si después de 5 minutos no llegó el USDC.e:
 * - Se lanza error "Bridge timeout - USDC.e not received"
 * - El usuario debe revisar manualmente en Polygonscan
 *
 * Por qué 5 minutos:
 * - Normalmente el bridge tarda 30-60 segundos
 * - En casos extremos puede tardar 2-3 minutos
 * - 5 minutos es margen de seguridad razonable
 */
export const BRIDGE_POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

/**
 * Dirección zero para hooks de Uniswap V4.
 *
 * Uniswap V4 permite "hooks" personalizados en los pools.
 * Un hook puede ejecutar código custom antes/después de swaps.
 *
 * Para el pool USDC.e/USDC estándar:
 * - No usa hooks personalizados
 * - hooks = 0x0000000000000000000000000000000000000000
 *
 * Esto es requerido para construir el PoolKey del swap.
 */
export const HOOKS_ZERO = "0x0000000000000000000000000000000000000000" as const;

/**
 * Gas price fijo para transacciones en Polygon (en Wei).
 * - 25000000000 Wei = 25 Gwei
 *
 * Por qué usamos gas price fijo:
 * - Polygon tiene gas price muy estable (~30-50 Gwei)
 * - 25 Gwei asegura ejecución rápida sin pagar de más
 * - Safe Protocol Kit usa este valor para estimar costos
 *
 * Esto se usa en:
 * - createTransaction options (gasPrice)
 * - executeTransaction options (getPolygonTxOptions)
 */
export const POLYGON_GAS_PRICE_WEI = "25000000000" as const; // 25 Gwei

/**
 * URL del API de Polymarket para obtener direcciones de depósito del bridge.
 *
 * Flujo:
 * 1. POST https://bridge.polymarket.com/deposit
 * 2. Body: { "address": "0xSafeAddress..." }
 * 3. Response: { "address": { "evm": "0xUniqueDepositAddress..." } }
 * 4. Safe envía USDC a esa dirección única
 * 5. Bridge detecta el depósito y envía USDC.e al Safe
 *
 * Cada Safe obtiene una dirección de depósito única y permanente.
 * Puedes reutilizar la misma dirección en futuros depósitos.
 */
export const POLYMARKET_BRIDGE_DEPOSIT_URL = "https://bridge.polymarket.com/deposit";
