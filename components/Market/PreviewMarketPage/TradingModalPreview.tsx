'use client'

import { useState } from 'react'
import { useWallet } from '@/providers/WalletContext'
import { useDictionary } from '@/providers/dictionary-provider'

interface TradingModalPreviewProps {
  marketTitle?: string
  marketImage?: string
}

export default function TradingModalPreview({
  marketTitle = 'Market',
  marketImage = 'https://via.placeholder.com/80'
}: TradingModalPreviewProps) {
  const { dict } = useDictionary()
  const { connect } = useWallet()
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit')
  const [outcome, setOutcome] = useState<'yes' | 'no'>('yes')

  return (
    <div className="card bg-base-100 border border-base-300 sticky top-20">
      <div className="card-body p-4">
        {/* Header with Market Info */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-base-300">
          <img
            src={marketImage}
            alt={marketTitle}
            className="w-14 h-14 rounded-lg object-cover"
          />
          <h2 className="text-lg font-bold text-base-content line-clamp-2">{marketTitle}</h2>
        </div>

        {/* Buy/Sell Toggle and Order Type */}
        <div className="flex items-center justify-between mb-4">
          <div role="tablist" className="tabs tabs-bordered tabs-sm">
            <button
              role="tab"
              onClick={() => setTradeType('buy')}
              className={`tab font-bold text-sm ${tradeType === 'buy' ? 'tab-active' : ''}`}
            >
              {dict.marketDetail.tradingModal.buy}
            </button>
            <button
              role="tab"
              onClick={() => setTradeType('sell')}
              className={`tab font-bold text-sm ${tradeType === 'sell' ? 'tab-active' : ''}`}
            >
              {dict.marketDetail.tradingModal.sell}
            </button>
          </div>

          <div className="dropdown dropdown-end">
            <button tabIndex={0} className="btn btn-ghost btn-sm gap-2">
              {orderType === 'limit' ? dict.marketDetail.tradingModal.limit : dict.marketDetail.tradingModal.market}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-1 w-32 p-2 border border-base-300">
              <li><a onClick={() => setOrderType('limit')}>{dict.marketDetail.tradingModal.limit}</a></li>
              <li><a onClick={() => setOrderType('market')}>{dict.marketDetail.tradingModal.market}</a></li>
            </ul>
          </div>
        </div>

        {/* Yes/No Outcome Buttons - NO PRICES IN PREVIEW */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            onClick={() => setOutcome('yes')}
            className={`badge badge-md justify-center py-4 font-bold text-sm w-full cursor-pointer ${
              outcome === 'yes' ? 'badge-soft badge-success' : 'badge-ghost'
            }`}
          >
            {dict.marketDetail.tradingModal.yes}
            {/* NO PRICE */}
          </div>
          <div
            onClick={() => setOutcome('no')}
            className={`badge badge-md justify-center py-4 font-bold text-sm w-full cursor-pointer ${
              outcome === 'no' ? 'badge-soft badge-error' : 'badge-ghost'
            }`}
          >
            {dict.marketDetail.tradingModal.no}
            {/* NO PRICE */}
          </div>
        </div>

        {/* Limit Price - Placeholder */}
        {orderType === 'limit' && (
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-base-content">{dict.marketDetail.tradingModal.limitPrice}</label>
            <div className="join border border-base-300">
              <button className="btn btn-xs join-item" disabled>−</button>
              <div className="join-item flex items-center px-3 bg-base-200">
                <span className="text-base font-bold text-base-content/30">--.-¢</span>
              </div>
              <button className="btn btn-xs join-item" disabled>+</button>
            </div>
          </div>
        )}

        {/* Shares Input - Disabled */}
        <div className="mb-4">
          <label className="text-sm font-bold text-base-content mb-2 block">{dict.marketDetail.tradingModal.shares}</label>
          <input
            type="number"
            disabled
            className="input input-bordered input-sm w-full text-xl font-bold text-right text-base-content/30 px-3 cursor-not-allowed"
            placeholder="0"
          />
        </div>

        {/* Quick adjustment buttons - Disabled */}
        <div className="grid grid-cols-4 gap-1 mb-4">
          {['-100', '-10', '+10', '+100'].map((label) => (
            <button
              key={label}
              disabled
              className="btn btn-outline btn-xs text-xs cursor-not-allowed"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary - Placeholder */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-base-content">{dict.marketDetail.tradingModal.total}</span>
            <span className="text-base font-bold text-base-content/30">$0.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-base-content">{dict.marketDetail.tradingModal.toWin}</span>
            <span className="text-base font-bold text-base-content/30">$0.00</span>
          </div>
        </div>

        {/* Trade Button - Triggers connect */}
        <button
          onClick={connect}
          className="btn btn-sm w-full text-sm font-bold bg-green-600 hover:bg-green-700 text-white border-green-600"
        >
          {dict.marketDetail.tradingModal.trade}
        </button>
      </div>
    </div>
  )
}
