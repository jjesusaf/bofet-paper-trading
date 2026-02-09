'use client'

import { useState, useEffect } from 'react'
import { useDictionary } from '@/providers/dictionary-provider'
import useMarketOrder from '@/hooks/useMarketOrder'
import usePolygonBalances from '@/hooks/usePolygonBalances'
import useTickSize from '@/hooks/useTickSize'
import useUserPositions from '@/hooks/useUserPositions'
import { useTrading } from '@/providers/TradingProvider'
import { isValidDecimalInput } from '@/utils/validation'
import DepositModal from '@/components/PolygonAssets/DepositModal'
import { MIN_BRIDGE_DEPOSIT } from '@/constants/api'

interface TradingModalProps {
  marketTitle?: string
  marketImage?: string
  yesPrice?: number
  noPrice?: number
  yesTokenId?: string
  noTokenId?: string
  negRisk?: boolean
  // Props para controlar externamente (desde OrderBook click)
  externalOrderType?: 'limit' | 'market'
  externalOutcome?: 'yes' | 'no'
  externalLimitPrice?: number
  externalTradeType?: 'buy' | 'sell'
  externalShares?: number
  // Props para modal en mobile
  isOpen?: boolean
  onClose?: () => void
  selectedOutcome?: 'yes' | 'no'
  // Callback para notificar cambios de outcome
  onOutcomeChange?: (outcome: 'yes' | 'no') => void
}

interface TradeData {
  type: 'buy' | 'sell'
  outcome: 'yes' | 'no'
  orderType: 'limit' | 'market'
  limitPrice: number
  shares: number
  expiration: boolean
}

export default function TradingModal({
  marketTitle = '25+ bps increase',
  marketImage = 'https://via.placeholder.com/80',
  yesPrice = 0.2,
  noPrice = 99.9,
  yesTokenId,
  noTokenId,
  negRisk = false,
  externalOrderType,
  externalOutcome,
  externalLimitPrice,
  externalTradeType,
  externalShares,
  isOpen,
  onClose,
  selectedOutcome = 'yes',
  onOutcomeChange,
}: TradingModalProps) {
  const { dict } = useDictionary()
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  // Desktop inicia en 'market', Mobile en 'limit'
  // Desktop: isOpen es undefined, Mobile: isOpen es boolean
  const [orderType, setOrderType] = useState<'limit' | 'market'>(() => {
    const isMobile = isOpen !== undefined
    return isMobile ? 'limit' : 'market'
  })
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes')
  const [limitPrice, setLimitPrice] = useState(yesPrice)
  const [shares, setShares] = useState('')
  const [expiration, setExpiration] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false)

  // Desktop: siempre visible, Mobile: solo cuando isOpen
  const isMobileModal = isOpen !== undefined

  // Trading hooks
  const { clobClient, safeAddress } = useTrading()
  const { formattedNativeUsdcBalance, rawUsdcBalance, rawNativeUsdcBalance } = usePolygonBalances(safeAddress)
  const { data: positions = [] } = useUserPositions(safeAddress)

  // Determine active tokenId based on selected outcome
  const activeTokenId = outcome === 'yes' ? yesTokenId : noTokenId

  // Fetch tick size for the active token
  const { tickSize, isLoading: isLoadingTickSize } = useTickSize(activeTokenId || null)

  // Unified order hook
  const {
    executeOrder,
    isExecuting,
    status: marketStatus,
    progressMessage, // Dynamic progress message from hooks
    error: marketOrderError,
  } = useMarketOrder()

  // Helper functions for price validation
  function getDecimalPlaces(tickSize: number): number {
    if (tickSize >= 1) return 0
    const str = tickSize.toString()
    const decimalPart = str.split('.')[1]
    return decimalPart ? decimalPart.length : 0
  }

  function isValidTickPrice(price: number, tickSize: number): boolean {
    if (tickSize <= 0) return false
    const multiplier = Math.round(price / tickSize)
    const expectedPrice = multiplier * tickSize
    return Math.abs(price - expectedPrice) < 1e-10
  }

  const decimalPlaces = getDecimalPlaces(tickSize)

  // Para órdenes de mercado, usar el precio actual; para límite, usar limitPrice
  const effectivePrice = orderType === 'market'
    ? (outcome === 'yes' ? yesPrice : noPrice)
    : limitPrice

  const sharesNum = parseFloat(shares) || 0
  const total = sharesNum * effectivePrice
  const toWin = outcome === 'yes' ? sharesNum * (1 - effectivePrice) : sharesNum * effectivePrice

  // Actualizar precio límite cuando cambian los precios del mercado
  useEffect(() => {
    const newPrice = outcome === 'yes' ? yesPrice : noPrice
    // Round to nearest tick size to avoid validation errors
    const roundedPrice = tickSize > 0 ? Math.round(newPrice / tickSize) * tickSize : newPrice
    setLimitPrice(roundedPrice)
  }, [yesPrice, noPrice, outcome, tickSize])

  // Escuchar cambios externos (desde OrderBook click)
  useEffect(() => {
    if (externalOrderType) setOrderType(externalOrderType)
    if (externalOutcome) {
      setOutcome(externalOutcome)
      // Solo actualizar limitPrice si NO hay externalLimitPrice definido
      if (externalLimitPrice === undefined) {
        const newPrice = externalOutcome === 'yes' ? yesPrice : noPrice
        const roundedPrice = tickSize > 0 ? Math.round(newPrice / tickSize) * tickSize : newPrice
        setLimitPrice(roundedPrice)
      }
    }
    if (externalLimitPrice !== undefined) {
      const roundedPrice = tickSize > 0 ? Math.round(externalLimitPrice / tickSize) * tickSize : externalLimitPrice
      setLimitPrice(roundedPrice)
    }
    if (externalTradeType) setTradeType(externalTradeType)
    if (externalShares !== undefined) setShares(externalShares.toString())
  }, [externalOrderType, externalOutcome, externalLimitPrice, externalTradeType, externalShares, yesPrice, noPrice, tickSize])

  // Escuchar cambios de selectedOutcome (desde TradingButtons en mobile)
  useEffect(() => {
    if (selectedOutcome) {
      setOutcome(selectedOutcome)
      const newPrice = selectedOutcome === 'yes' ? yesPrice : noPrice
      const roundedPrice = tickSize > 0 ? Math.round(newPrice / tickSize) * tickSize : newPrice
      setLimitPrice(roundedPrice)
    }
  }, [selectedOutcome, yesPrice, noPrice, tickSize])

  // Resetear estado cuando se abre el modal en mobile
  useEffect(() => {
    if (isOpen && externalOrderType) {
      setOrderType(externalOrderType)
    }
  }, [isOpen, externalOrderType])

  // Limpiar errores cuando el usuario cambia inputs
  useEffect(() => {
    setLocalError(null)
  }, [shares, outcome, orderType, tradeType])


  const handleTrade = async () => {
    // Validar que tenemos tokenId
    if (!activeTokenId) {
      setLocalError('Token ID no disponible')
      return
    }

    const sharesNum = parseFloat(shares) || 0

    // Validar shares mínimo
    if (sharesNum <= 0) {
      setLocalError('Las shares deben ser mayores a 0')
      return
    }

    // Validaciones para órdenes límite
    if (orderType === 'limit') {
      // Validar que tenemos precio límite
      if (!limitPrice || limitPrice <= 0) {
        setLocalError('El precio límite es requerido')
        return
      }

      // Validar rango de precio
      if (limitPrice < tickSize || limitPrice > 1 - tickSize) {
        const minPrice = tickSize.toFixed(decimalPlaces)
        const maxPrice = (1 - tickSize).toFixed(decimalPlaces)
        setLocalError(`El precio debe estar entre $${minPrice} y $${maxPrice}`)
        return
      }

      // Validar que sea múltiplo del tick size
      if (!isValidTickPrice(limitPrice, tickSize)) {
        setLocalError(`El precio debe ser múltiplo de $${tickSize}`)
        return
      }
    }

    try {
      setLocalError(null)

      // Calcular monto en USD según el tipo de orden
      const priceToUse = orderType === 'market'
        ? (outcome === 'yes' ? yesPrice || 0.5 : noPrice || 0.5)
        : limitPrice
      const amountUsd = sharesNum * priceToUse

      // Validación de mínimo para BUY (necesita >= $2 para bridge si no hay USDC.e)
      if (tradeType === 'buy' && amountUsd < MIN_BRIDGE_DEPOSIT) {
        setLocalError(`La compra debe ser de al menos $${MIN_BRIDGE_DEPOSIT} USD. Monto actual: $${amountUsd.toFixed(2)}`)
        return
      }

      // Validación de balance para BUY
      if (tradeType === 'buy') {
        const totalUsdc = (rawUsdcBalance ?? BigInt(0)) + (rawNativeUsdcBalance ?? BigInt(0))
        const totalUsdcFormatted = Number(totalUsdc) / 1e6

        if (amountUsd > totalUsdcFormatted) {
          setLocalError(`Saldo insuficiente. Necesitas $${amountUsd.toFixed(2)} pero solo tienes $${totalUsdcFormatted.toFixed(2)} USDC total.`)
          return
        }
      }

      // Validación de balance para SELL
      if (tradeType === 'sell') {
        // Buscar la posición del usuario para este token
        const position = positions.find((p) => p.asset === activeTokenId)
        const availableShares = position?.size ?? 0

        if (availableShares === 0 || sharesNum > availableShares) {
          setLocalError('Balance insuficiente')
          return
        }

        // Validación de mínimo después del fee
        const amountAfterFee = amountUsd * 0.99 // 1% fee
        if (amountAfterFee < MIN_BRIDGE_DEPOSIT) {
          setLocalError(`La venta debe generar al menos $${MIN_BRIDGE_DEPOSIT} USD (después del fee 1%). Monto actual después de fee: $${amountAfterFee.toFixed(2)}`)
          return
        }
      }

      // useMarketOrder handles everything automatically:
      // - If enough USDC.e in Safe → execute order directly
      // - If not enough USDC.e → convert USDC to USDC.e from Safe (min 2 USDC required)

      // Usar executeOrder para ambos tipos (market y limit)
      const result = await executeOrder({
        tokenId: activeTokenId,
        amount: amountUsd,
        size: sharesNum,
        side: tradeType.toUpperCase() as 'BUY' | 'SELL',
        price: orderType === 'limit' ? limitPrice : undefined,
        isMarketOrder: orderType === 'market',
        negRisk: negRisk || false,
      })

      if (result.success && result.orderId) {
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          setShares('')
          if (onClose) onClose()
        }, 2000)
      }
    } catch (err) {
      console.error('Error ejecutando orden:', err)
    }
  }


  const adjustPrice = (amount: number) => {
    const newPrice = limitPrice + amount
    const roundedPrice = Math.round(newPrice / tickSize) * tickSize
    setLimitPrice(Math.max(tickSize, Math.min(1 - tickSize, roundedPrice)))
  }

  const getQuickButtons = () => {
    if (tradeType === 'sell') {
      return [
        { label: dict.marketDetail.tradingModal.quickButtons.percent25, value: 0.25, isPercent: true },
        { label: dict.marketDetail.tradingModal.quickButtons.percent50, value: 0.50, isPercent: true },
        { label: '75%', value: 0.75, isPercent: true },
        { label: '100%', value: 1.0, isPercent: true },
      ]
    }
    return [
      { label: dict.marketDetail.tradingModal.quickButtons.minus100, value: -100, isPercent: false },
      { label: dict.marketDetail.tradingModal.quickButtons.minus10, value: -10, isPercent: false },
      { label: dict.marketDetail.tradingModal.quickButtons.plus10, value: 10, isPercent: false },
      { label: dict.marketDetail.tradingModal.quickButtons.plus100, value: 100, isPercent: false },
    ]
  }

  const handleQuickButton = (value: number, isPercent: boolean) => {
    if (isPercent && tradeType === 'sell') {
      const tokenId = outcome === 'yes' ? yesTokenId : noTokenId
      if (!tokenId) {
        console.error('Token ID not available')
        return
      }

      const position = positions.find((p) => p.asset === tokenId)
      if (!position || position.size <= 0) {
        console.log('❌ [TradingModal] No position found for this token:', tokenId)
        setShares('0')
        return
      }

      const sharesToSell = value === 1.0
        ? position.size
        : Math.floor(position.size * value * 100) / 100
      const sharesString = value === 1.0
        ? position.size.toString() 
        : sharesToSell.toFixed(2) 

      setShares(sharesString)
    } else {
      const currentShares = parseFloat(shares) || 0
      const newShares = Math.max(0, currentShares + value)
      setShares(newShares.toString())
    }
  }

  return (
    <>
      {/* Backdrop para mobile */}
      {isMobileModal && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 animate-fade-in lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Trading Modal */}
      <div
        className={`
          card bg-base-100 border border-base-300 overflow-x-hidden
          ${isMobileModal
            ? `fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl lg:sticky lg:top-20 lg:rounded-lg transform transition-all duration-300 ease-out ${isOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
            }`
            : 'sticky top-20'
          }
        `}
        style={isMobileModal && isOpen ? { maxHeight: '90vh' } : undefined}
      >
        {/* Handle Bar para mobile */}
        {isMobileModal && (
          <div
            className="flex justify-center pt-3 pb-2 cursor-pointer lg:hidden"
            onClick={onClose}
          >
            <div className="w-12 h-1 bg-base-300 rounded-full" />
          </div>
        )}

        <div className={`card-body p-4 ${isMobileModal ? 'overflow-y-auto' : ''}`} style={isMobileModal && isOpen ? { maxHeight: 'calc(90vh - 20px)' } : undefined}>
          {/* Header with Market Info */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-base-300">
            <img
              src={marketImage}
              alt={marketTitle}
              className="w-14 h-14 rounded-lg object-cover"
            />
            <h2 className="text-lg font-bold text-base-content">{marketTitle}</h2>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div role="alert" className="alert alert-success mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">¡Orden colocada exitosamente!</h3>
                <div className="text-sm opacity-90">Tu orden ha sido procesada correctamente.</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {(localError || marketOrderError) && (() => {
            const error = localError ?? marketOrderError
            const errorMsg = typeof error === 'string' ? error : error?.message ?? ''

            // Detect error type for clearer messages
            const isInsufficientPol = errorMsg.includes('Insufficient POL') || errorMsg.includes('insufficient funds for gas')
            const isInsufficientBalance = errorMsg.includes('INSUFFICIENT_BALANCE') || (marketOrderError && (marketOrderError as Error & { code?: string }).code === 'INSUFFICIENT_BALANCE')
            const isRateLimit = errorMsg.includes('Too many requests') || errorMsg.includes('rate limit')

            return (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm">
                    {isInsufficientPol ? 'Necesitas ~0.1 POL en tu wallet para pagar gas'
                      : isInsufficientBalance ? 'Saldo insuficiente'
                        : isRateLimit ? 'Demasiados intentos. Espera 1 minuto'
                          : errorMsg}
                  </span>
                </div>
                {isInsufficientBalance && (
                  <button
                    onClick={() => {
                      // Track deposit modal trigger goal
                      if (typeof window !== 'undefined' && (window as any).datafast) {
                        (window as any).datafast('deposit_modal_triggered');
                      }
                      setIsDepositModalOpen(true);
                    }}
                    className="mt-2 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Depositar
                  </button>
                )}
              </div>
            )
          })()}

          {/* Buy/Sell Toggle and Order Type */}
          <div className="flex items-center justify-between gap-2 md:gap-3 mb-4">
            <div className="join border border-gray-300 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setTradeType('buy')}
                className={`px-3 sm:px-4 md:px-6 py-2 font-bold text-xs sm:text-sm join-item transition-colors cursor-pointer whitespace-nowrap ${tradeType === 'buy'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-white hover:bg-gray-100'
                  }`}
              >
                {dict.marketDetail.tradingModal.buy}
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`px-3 sm:px-4 md:px-6 py-2 font-bold text-xs sm:text-sm join-item transition-colors cursor-pointer whitespace-nowrap ${tradeType === 'sell'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-white hover:bg-gray-100'
                  }`}
              >
                {dict.marketDetail.tradingModal.sell}
              </button>
            </div>

            {/* Desktop: Dropdown (Icon on medium, Text on large), Mobile: Toggle Switch */}
            <div className="hidden lg:flex shrink-0">
              <div className="dropdown dropdown-end">
                <button
                  tabIndex={0}
                  className="btn btn-ghost btn-sm cursor-pointer gap-1.5 px-2.5"
                  title={orderType === 'limit' ? dict.marketDetail.tradingModal.limit : dict.marketDetail.tradingModal.market}
                >
                  {/* Icon only on smaller desktop, text on larger desktop */}
                  <svg className="w-4 h-4 shrink-0 xl:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="hidden xl:inline text-sm">{orderType === 'limit' ? dict.marketDetail.tradingModal.limit : dict.marketDetail.tradingModal.market}</span>
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-32 p-2 border border-base-300 shadow-lg">
                  <li><a onClick={() => setOrderType('limit')} className="text-sm">{dict.marketDetail.tradingModal.limit}</a></li>
                  <li><a onClick={() => setOrderType('market')} className="text-sm">{dict.marketDetail.tradingModal.market}</a></li>
                </ul>
              </div>
            </div>

            {/* Mobile: Toggle Switch */}
            <div className="lg:hidden flex items-center gap-2 shrink min-w-0">
              <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${orderType === 'limit' ? 'text-base-content' : 'text-base-content/50'}`}>
                {dict.marketDetail.tradingModal.limit}
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-xs sm:toggle-sm shrink-0"
                checked={orderType === 'market'}
                onChange={(e) => setOrderType(e.target.checked ? 'market' : 'limit')}
              />
              <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${orderType === 'market' ? 'text-base-content' : 'text-base-content/50'}`}>
                {dict.marketDetail.tradingModal.market}
              </span>
            </div>
          </div>

          {/* Yes/No Outcome Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => {
                setOutcome('yes')
                const roundedPrice = tickSize > 0 ? Math.round(yesPrice / tickSize) * tickSize : yesPrice
                setLimitPrice(roundedPrice)
                setShares('')
                onOutcomeChange?.('yes')
              }}
              className={`py-2 px-4 font-bold text-sm rounded-lg transition-colors border cursor-pointer ${outcome === 'yes'
                  ? 'bg-green-100 border-green-600 text-green-700 hover:bg-green-200'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
                }`}
            >
              {dict.marketDetail.tradingModal.yes} {(yesPrice * 100).toFixed(1)}¢
            </button>
            <button
              onClick={() => {
                setOutcome('no')
                const roundedPrice = tickSize > 0 ? Math.round(noPrice / tickSize) * tickSize : noPrice
                setLimitPrice(roundedPrice)
                setShares('')
                onOutcomeChange?.('no')
              }}
              className={`py-2 px-4 font-bold text-sm rounded-lg transition-colors border cursor-pointer ${outcome === 'no'
                  ? 'bg-red-100 border-red-600 text-red-700 hover:bg-red-200'
                  : 'bg-white border-gray-300 hover:bg-gray-100'
                }`}
            >
              {dict.marketDetail.tradingModal.no} {(noPrice * 100).toFixed(1)}¢
            </button>
          </div>

          {/* Limit Price - Only show for Limit orders */}
          {orderType === 'limit' && (
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-gray-900">{dict.marketDetail.tradingModal.limitPrice}</label>
              <div className="join border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => adjustPrice(-tickSize)}
                  className="btn btn-xs join-item bg-white hover:bg-gray-100 cursor-pointer"
                >
                  −
                </button>
                <div className="join-item flex items-center px-3 bg-gray-50">
                  <span className="text-base font-bold text-gray-900">
                    {(limitPrice * 100).toFixed(1)}¢
                  </span>
                </div>
                <button
                  onClick={() => adjustPrice(tickSize)}
                  className="btn btn-xs join-item bg-white hover:bg-gray-100 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Shares input - always shown */}
          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">{dict.marketDetail.tradingModal.shares}</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
              value={shares}
              onChange={(e) => {
                if (isValidDecimalInput(e.target.value)) {
                  setShares(e.target.value)
                }
              }}
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 text-base"
              placeholder="0"
            />
          </div>

          {/* Quick adjustment buttons - above Total / A ganar */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {getQuickButtons().map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleQuickButton(btn.value, btn.isPercent)}
                className={`py-2 px-3 border border-gray-300 hover:bg-gray-100 text-xs rounded-lg font-medium transition-colors cursor-pointer ${btn.isPercent && tradeType === 'sell' ? 'bg-blue-50 border-blue-300' : ''
                  }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Summary - Total and A ganar */}
          <div className="space-y-3 mb-4">
            {tradeType === 'buy' ? (
              <>
                {/* Always show cost/amount for buy orders */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-base-content">
                    {orderType === 'market' ? dict.marketDetail.tradingModal.amount : dict.marketDetail.tradingModal.total}
                  </span>
                  <span className="text-base font-bold text-primary">
                    ${total.toFixed(2)}
                  </span>
                </div>
                {/* Show potential winnings or shares */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-base-content">
                      {orderType === 'market' ? dict.marketDetail.tradingModal.youllGet : dict.marketDetail.tradingModal.toWin}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-base-content/60">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="text-base font-bold text-success">
                    {orderType === 'market' ? `${sharesNum.toFixed(2)} shares` : `$${toWin.toFixed(2)}`}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-base-content">{dict.marketDetail.tradingModal.youllReceive}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-base-content/60">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-base font-bold text-success">
                  ${total.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Trade Button */}
          {(() => {
            const isBusy = isExecuting
            const disabled = isBusy || sharesNum <= 0 || !clobClient
            let buttonLabel = dict.marketDetail.tradingModal.trade
            let helpText = ""

            if (isExecuting) {
              if (marketStatus === 'checking-balance') {
                buttonLabel = 'Verificando...'
              } else if (marketStatus === 'placing-order') {
                buttonLabel = 'Ejecutando...'
              } else {
                buttonLabel = 'Procesando...'
              }
              helpText = progressMessage || 'Un momento por favor'
            }

            return (
              <>
                <button
                  onClick={handleTrade}
                  disabled={disabled}
                  className={`w-full py-3 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${sharesNum > 0 && clobClient && !isBusy
                      ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                      : 'bg-gray-600 text-white cursor-not-allowed'
                    }`}
                >
                  {isExecuting && <span className="loading loading-spinner loading-sm"></span>}
                  {buttonLabel}
                </button>
                {isExecuting && helpText && (
                  <p className="text-xs text-gray-500 mt-2 text-center animate-pulse">
                    {helpText}
                  </p>
                )}
                {!clobClient && (
                  <p className="text-xs text-yellow-600 mt-2 text-center">
                    Inicializa el cliente CLOB primero
                  </p>
                )}
                {/* Available balance */}
                {safeAddress && formattedNativeUsdcBalance && (
                  <p className="text-xs text-gray-500 mt-2">
                    Disponible: ${formattedNativeUsdcBalance} USD
                  </p>
                )}
              </>
            )
          })()}
        </div>
      </div>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </>
  )
}
