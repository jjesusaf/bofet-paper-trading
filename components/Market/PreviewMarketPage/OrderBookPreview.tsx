'use client'

import { useState } from 'react'
import { useDictionary } from '@/providers/dictionary-provider'

export default function OrderBookPreview() {
  const { dict } = useDictionary()
  const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes')
  const [expanded, setExpanded] = useState(true)

  // Dummy data for preview (will be blurred)
  const dummyRows = [
    { price: '--.--¢', shares: '---', total: '$---' },
    { price: '--.--¢', shares: '---', total: '$---' },
    { price: '--.--¢', shares: '---', total: '$---' },
  ]

  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden relative h-full">
      {/* Blur overlay */}
      {expanded && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-md z-10 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <p className="text-sm font-semibold text-gray-600">
              Inicia sesión para ver el libro de órdenes
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 relative z-0">
        <h2 className="text-2xl font-bold text-base-content">{dict.marketDetail.orderBook.title}</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="btn btn-ghost btn-circle btn-sm"
          aria-label={dict.marketDetail.orderBook.toggleOrderBook}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transform transition-transform ${expanded ? 'rotate-180' : ''}`}
          >
            <path
              d="M18 15L12 9L6 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="relative z-0">
          {/* Tabs and Refresh */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('yes')}
                className={`text-lg font-bold pb-1 border-b-2 transition-colors ${
                  activeTab === 'yes'
                    ? 'text-base-content border-base-content'
                    : 'text-base-content/40 border-transparent'
                }`}
              >
                {dict.marketDetail.orderBook.tradeYes}
              </button>
              <button
                onClick={() => setActiveTab('no')}
                className={`text-lg font-bold pb-1 border-b-2 transition-colors ${
                  activeTab === 'no'
                    ? 'text-base-content border-base-content'
                    : 'text-base-content/40 border-transparent'
                }`}
              >
                {dict.marketDetail.orderBook.tradeNo}
              </button>
            </div>

            <div className="flex items-center gap-2 text-base-content/40">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 4V10H7M23 20V14H17M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-base font-medium">--.--¢</span>
            </div>
          </div>

          {/* Table Headers */}
          <div className="px-6">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-base-content/40 uppercase tracking-wide mb-2">
              <div className="col-span-3 flex items-center gap-2">
                {dict.marketDetail.orderBook.tradeYes.toUpperCase()}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <div className="col-span-3 text-right">{dict.marketDetail.orderBook.price}</div>
              <div className="col-span-3 text-right">{dict.marketDetail.orderBook.shares}</div>
              <div className="col-span-3 text-right">{dict.marketDetail.orderBook.total}</div>
            </div>

            {/* Asks Section */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="badge badge-soft badge-error badge-lg font-bold">
                  {dict.marketDetail.orderBook.asks}
                </span>
              </div>

              {dummyRows.map((ask, index) => (
                <div key={index} className="relative mb-2">
                  <div className="relative grid grid-cols-12 gap-4 py-3 text-base opacity-30">
                    <div className="col-span-3"></div>
                    <div className="col-span-3 text-right font-bold text-error">
                      {ask.price}
                    </div>
                    <div className="col-span-3 text-right text-base-content">
                      {ask.shares}
                    </div>
                    <div className="col-span-3 text-right text-base-content font-medium">
                      {ask.total}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Last Price & Spread */}
            <div className="flex items-center justify-between py-3 border-y border-base-300 mb-4">
              <span className="text-base text-base-content/40">
                {dict.marketDetail.orderBook.last} <span className="font-semibold">--.--¢</span>
              </span>
              <span className="text-base text-base-content/40">
                {dict.marketDetail.orderBook.spread} <span className="font-semibold">--.--¢</span>
              </span>
            </div>

            {/* Bids Section */}
            <div className="pb-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="badge badge-soft badge-success badge-lg font-bold">
                  {dict.marketDetail.orderBook.bids}
                </span>
              </div>

              {dummyRows.map((bid, index) => (
                <div key={index} className="relative mb-2">
                  <div className="relative grid grid-cols-12 gap-4 py-3 text-base opacity-30">
                    <div className="col-span-3"></div>
                    <div className="col-span-3 text-right font-bold text-success">
                      {bid.price}
                    </div>
                    <div className="col-span-3 text-right text-base-content">
                      {bid.shares}
                    </div>
                    <div className="col-span-3 text-right text-base-content font-medium">
                      {bid.total}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
