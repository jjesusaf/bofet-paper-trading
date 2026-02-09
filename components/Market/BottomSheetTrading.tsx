'use client'

import { useState, useEffect } from 'react'
import { useDictionary } from '@/providers/dictionary-provider'

interface BottomSheetTradingProps {
  isOpen: boolean
  onClose: () => void
  marketTitle?: string
  marketImage?: string
  yesPrice?: number
  noPrice?: number
  selectedOutcome?: 'yes' | 'no'
  onTrade?: (data: TradeData) => void
}

interface TradeData {
  type: 'buy' | 'sell'
  outcome: 'yes' | 'no'
  orderType: 'limit' | 'market'
  limitPrice: number
  shares: number
  expiration: boolean
}

export default function BottomSheetTrading({
  isOpen,
  onClose,
  marketTitle = '25+ bps increase',
  marketImage = 'https://via.placeholder.com/80',
  yesPrice = 0.2,
  noPrice = 99.9,
  selectedOutcome = 'yes',
  onTrade,
}: BottomSheetTradingProps) {
  const { dict } = useDictionary()
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit')
  const [outcome, setOutcome] = useState<'yes' | 'no'>(selectedOutcome)
  const [limitPrice, setLimitPrice] = useState(selectedOutcome === 'yes' ? yesPrice : noPrice)
  const [shares, setShares] = useState(0)
  const [expiration, setExpiration] = useState(false)

  useEffect(() => {
    setOutcome(selectedOutcome)
    setLimitPrice(selectedOutcome === 'yes' ? yesPrice : noPrice)
  }, [selectedOutcome, yesPrice, noPrice])

  const total = shares * limitPrice
  const toWin = outcome === 'yes' ? shares * (1 - limitPrice) : shares * limitPrice

  const handleTrade = () => {
    if (onTrade) {
      onTrade({
        type: tradeType,
        outcome,
        orderType,
        limitPrice,
        shares,
        expiration,
      })
    } else {
      console.log('Trade:', { tradeType, outcome, orderType, limitPrice, shares, expiration })
    }
    onClose()
  }

  const adjustPrice = (amount: number) => {
    setLimitPrice(Math.max(0.1, Math.min(99.9, +(limitPrice + amount).toFixed(1))))
  }

  const adjustShares = (amount: number) => {
    setShares(Math.max(0, shares + amount))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet Modal */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-base-100 rounded-t-3xl z-50 transform transition-all duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle Bar */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-pointer"
          onClick={onClose}
        >
          <div className="w-12 h-1 bg-base-300 rounded-full" />
        </div>

        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(90vh - 20px)' }}>
          {/* Buy/Sell Toggle and Order Type */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-base-300">
            <div className="dropdown dropdown-bottom">
              <div tabIndex={0} role="button" className="btn btn-ghost text-2xl font-bold gap-2">
                {tradeType === 'buy' ? dict.marketDetail.tradingModal.buy : dict.marketDetail.tradingModal.sell}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-32 p-2 border border-base-300">
                <li><a onClick={() => setTradeType('buy')}>{dict.marketDetail.tradingModal.buy}</a></li>
                <li><a onClick={() => setTradeType('sell')}>{dict.marketDetail.tradingModal.sell}</a></li>
              </ul>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-base-content/70">
                {orderType === 'limit' ? dict.marketDetail.tradingModal.limit : dict.marketDetail.tradingModal.market}
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={orderType === 'market'}
                onChange={(e) => setOrderType(e.target.checked ? 'market' : 'limit')}
              />
            </div>
          </div>

          {/* Market Info */}
          <div className="flex items-center gap-3 mb-6">
            <img src={marketImage} alt={marketTitle} className="w-16 h-16 rounded-xl object-cover" />
            <div>
              <h3 className="text-lg font-bold text-base-content">{marketTitle}</h3>
              <div className="flex items-center gap-2">
                <span className={`badge ${outcome === 'yes' ? 'badge-success' : 'badge-error'} badge-sm font-semibold`}>
                  {outcome === 'yes' ? dict.marketDetail.tradingModal.yes : dict.marketDetail.tradingModal.no}
                </span>
              </div>
            </div>
          </div>

          {/* Limit Price - Only for Limit orders */}
          {orderType === 'limit' && (
            <div className="flex items-center justify-between mb-6">
              <label className="text-xl font-bold text-base-content">{dict.marketDetail.bottomSheetTrading.limitPrice}</label>
              <div className="join border border-base-300">
                <button
                  onClick={() => adjustPrice(-0.1)}
                  className="btn btn-sm join-item"
                >
                  −
                </button>
                <div className="join-item flex items-center px-6 bg-base-200">
                  <span className="text-2xl font-bold text-base-content">
                    {limitPrice.toFixed(1)}¢
                  </span>
                </div>
                <button
                  onClick={() => adjustPrice(0.1)}
                  className="btn btn-sm join-item"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Shares Input */}
          <div className="mb-6">
            <label className="text-xl font-bold text-base-content mb-3 block">{dict.marketDetail.bottomSheetTrading.shares}</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*"
              value={shares || ''}
              onChange={(e) => {
                const value = e.target.value
                // Allow empty string, digits, and decimal point
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setShares(parseFloat(value) || 0)
                }
              }}
              className="input input-bordered w-full text-5xl font-bold text-right text-base-content/30 px-4"
              placeholder="0"
            />
            <div className="grid grid-cols-4 gap-1 mt-4">
              <button
                onClick={() => adjustShares(-100)}
                className="btn btn-outline btn-xs"
              >
                {dict.marketDetail.tradingModal.quickButtons.minus100}
              </button>
              <button
                onClick={() => adjustShares(-10)}
                className="btn btn-outline btn-xs"
              >
                {dict.marketDetail.tradingModal.quickButtons.minus10}
              </button>
              <button
                onClick={() => adjustShares(10)}
                className="btn btn-outline btn-xs"
              >
                {dict.marketDetail.tradingModal.quickButtons.plus10}
              </button>
              <button
                onClick={() => adjustShares(100)}
                className="btn btn-outline btn-xs"
              >
                {dict.marketDetail.tradingModal.quickButtons.plus100}
              </button>
            </div>
          </div>

          {/* Set Expiration - Only for Limit orders */}
          {orderType === 'limit' && (
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-base-300">
              <label className="text-lg text-base-content/70">{dict.marketDetail.bottomSheetTrading.setExpiration}</label>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={expiration}
                onChange={(e) => setExpiration(e.target.checked)}
              />
            </div>
          )}

          {/* Summary */}
          <div className="space-y-4 mb-6">
            {tradeType === 'buy' ? (
              <>
                {orderType === 'limit' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-base-content">{dict.marketDetail.bottomSheetTrading.total}</span>
                    <span className="text-2xl font-bold text-primary">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-base-content">
                      {dict.marketDetail.bottomSheetTrading.toWin}
                    </span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-base-content/60">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-success">
                    ${toWin.toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-base-content">{dict.marketDetail.bottomSheetTrading.youllReceive}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-base-content/60">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-2xl font-bold text-success">
                  ${total.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Trade Button */}
          <button
            onClick={handleTrade}
            disabled={shares <= 0}
            className={`btn btn-lg w-full text-xl font-bold mb-4 ${
              shares > 0
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                : 'bg-gray-600 text-white border-gray-600 cursor-not-allowed'
            }`}
          >
            {dict.marketDetail.bottomSheetTrading.trade}
          </button>

          {/* Terms */}
          <p className="text-center text-sm text-base-content/70">
            {dict.marketDetail.bottomSheetTrading.termsMessage}{' '}
            <a href="#" className="text-base-content underline">
              {dict.marketDetail.bottomSheetTrading.termsLink}
            </a>
            .
          </p>
        </div>
      </div>
    </>
  )
}
