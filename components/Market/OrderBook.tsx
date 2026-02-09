'use client'

import { useState, useRef, useEffect } from 'react'
import { useDictionary } from '@/providers/dictionary-provider'

interface OrderBookRow {
  price: string
  shares: string
  total: string
  cumulativeShares: number
}

interface OrderBookData {
  asks: OrderBookRow[]
  bids: OrderBookRow[]
  lastPrice: string
}

interface OrderBookProps {
  isExpanded?: boolean
  lastPrice?: string
  spread?: string
  asks: OrderBookRow[]
  bids: OrderBookRow[]
  yesOrderBook?: OrderBookData
  noOrderBook?: OrderBookData
  onOrderClick?: (data: { price: number; outcome: 'yes' | 'no'; side: 'buy' | 'sell'; shares: number }) => void
  onTabChange?: (outcome: 'yes' | 'no') => void
  selectedTab?: 'yes' | 'no'
}

export default function OrderBook({
  isExpanded,
  lastPrice,
  spread,
  asks,
  bids,
  yesOrderBook,
  noOrderBook,
  onOrderClick,
  onTabChange,
  selectedTab
}: OrderBookProps) {
  const { dict } = useDictionary()
  const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes')
  const [expanded, setExpanded] = useState(isExpanded)

  // Refs for scrolling
  const middleRef = useRef<HTMLTableSectionElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Actualizar tab cuando cambia externamente (desde TradingModal)
  useEffect(() => {
    if (selectedTab && selectedTab !== activeTab) {
      setActiveTab(selectedTab)
    }
  }, [selectedTab])

  // Handler para cambio de tab
  const handleTabChange = (tab: 'yes' | 'no') => {
    setActiveTab(tab)
    if (onTabChange) {
      onTabChange(tab)
    }
  }

  const scrollToMiddle = () => {
    if (middleRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const middle = middleRef.current

      // Force recalculation of dimensions
      const containerHeight = container.clientHeight
      const middleOffset = middle.offsetTop - container.offsetTop

      // Scroll to middle element centered in the container
      container.scrollTo({
        top: middleOffset - containerHeight / 2,
        behavior: 'smooth'
      })
    }
  }

  // Scroll to middle on mount and when expanded changes
  useEffect(() => {
    if (expanded && middleRef.current && scrollContainerRef.current) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        if (middleRef.current && scrollContainerRef.current) {
          const container = scrollContainerRef.current
          const middle = middleRef.current
          const containerHeight = container.clientHeight
          const middleOffset = middle.offsetTop - container.offsetTop

          // Initial scroll without smooth behavior
          container.scrollTop = middleOffset - containerHeight / 2
        }
      }, 100)
    }
  }, [expanded])

  // Use tab-specific data if available, otherwise use default props
  const currentOrderBook = activeTab === 'yes'
    ? (yesOrderBook || { asks, bids, lastPrice: lastPrice || '0.0¢' })
    : (noOrderBook || { asks, bids, lastPrice: lastPrice || '0.0¢' })

  const currentAsks = currentOrderBook.asks
  const currentBids = currentOrderBook.bids
  const currentLastPrice = currentOrderBook.lastPrice

  // Calculate max values for bar chart backgrounds (using cumulative totals)
  const maxAskTotal = currentAsks.length > 0
    ? Math.max(...currentAsks.map(a => parseFloat(a.total.replace(/[$,]/g, ''))))
    : 0
  const maxBidTotal = currentBids.length > 0
    ? Math.max(...currentBids.map(b => parseFloat(b.total.replace(/[$,]/g, ''))))
    : 0

  const getBarWidth = (total: string, max: number) => {
    const value = parseFloat(total.replace(/[$,]/g, ''))
    return (value / max) * 100
  }

  // Handler para click en una orden
  const handleOrderClick = (priceStr: string, cumulativeShares: number, side: 'buy' | 'sell') => {
    if (!onOrderClick) return

    // Parse price from "5.5¢" to 0.055 (decimal format)
    const priceInCents = parseFloat(priceStr.replace(/[¢,]/g, ''))
    const priceInDecimal = priceInCents / 100

    onOrderClick({
      price: priceInDecimal,
      outcome: activeTab,
      side,
      shares: cumulativeShares
    })
  }

  return (
    <div className="card bg-base-100 border border-base-300 overflow-hidden">
      {/* Header */}
      <div className="card-header flex items-center justify-between px-6 py-4 border-b border-base-300">
        <h2 className="card-title text-2xl">{dict.marketDetail.orderBook.title}</h2>
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
        <div className="card-body p-0">
          {/* Tabs and Spread */}
          <div className="flex items-center justify-between px-6 py-4 bg-base-200/50">
            <div className="tabs tabs-boxed bg-transparent gap-2">
              <button
                onClick={() => handleTabChange('yes')}
                className={`tab tab-lg font-bold ${
                  activeTab === 'yes' ? 'tab-active' : ''
                }`}
              >
                {dict.marketDetail.orderBook.tradeYes}
              </button>
              <button
                onClick={() => handleTabChange('no')}
                className={`tab tab-lg font-bold ${
                  activeTab === 'no' ? 'tab-active' : ''
                }`}
              >
                {dict.marketDetail.orderBook.tradeNo}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="badge badge-outline gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 4V10H7M23 20V14H17M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium">{spread}</span>
              </div>
            </div>
          </div>

          {/* Order Book Table */}
          <div className="overflow-x-auto px-6">
            <div ref={scrollContainerRef} className="overflow-y-auto max-h-[500px]">
              <table className="table table-pin-rows table-xs md:table-sm w-full">
                <thead>
                  <tr>
                    <th className="bg-base-200">
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-xs font-semibold">
                          {activeTab === 'yes' ? dict.marketDetail.orderBook.tradeYes : dict.marketDetail.orderBook.tradeNo}
                        </span>
                        <button
                          onClick={scrollToMiddle}
                          className="btn btn-ghost btn-xs cursor-pointer"
                          aria-label="Scroll to middle"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                            <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                            <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                            <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </th>
                    <th className="text-right bg-base-200 uppercase text-xs font-semibold">{dict.marketDetail.orderBook.price}</th>
                    <th className="text-right bg-base-200 uppercase text-xs font-semibold">{dict.marketDetail.orderBook.shares}</th>
                    <th className="text-right bg-base-200 uppercase text-xs font-semibold">{dict.marketDetail.orderBook.total}</th>
                  </tr>
                </thead>

                {/* Asks Section */}
                <tbody>
                  {currentAsks.map((ask, index) => (
                    <tr
                      key={`ask-${index}`}
                      className="hover cursor-pointer relative"
                      onClick={() => handleOrderClick(ask.price, ask.cumulativeShares, 'buy')}
                    >
                      <td className="relative">
                        {index === currentAsks.length - 1 && (
                          <span className="badge badge-outline badge-error badge-lg font-bold relative z-10">
                            {dict.marketDetail.orderBook.asks}
                          </span>
                        )}
                        <div
                          className="absolute right-0 top-0 h-full bg-error/10"
                          style={{ width: `${getBarWidth(ask.total, maxAskTotal)}%` }}
                        />
                      </td>
                      <td className="text-right font-bold text-error relative">{ask.price}</td>
                      <td className="text-right relative">{ask.shares}</td>
                      <td className="text-right font-medium relative">{ask.total}</td>
                    </tr>
                  ))}
                </tbody>

                {/* Last Price & Spread */}
                <tbody ref={middleRef}>
                  <tr className="border-y-2 border-base-300 bg-base-200/30">
                    <td colSpan={2} className="font-semibold">
                      {dict.marketDetail.orderBook.last} <span className="text-primary">{currentLastPrice}</span>
                    </td>
                    <td colSpan={2} className="text-right font-semibold">
                      {dict.marketDetail.orderBook.spread} <span className="text-primary">{spread}</span>
                    </td>
                  </tr>
                </tbody>

                {/* Bids Section */}
                <tbody>
                  {currentBids.map((bid, index) => (
                    <tr
                      key={`bid-${index}`}
                      className="hover cursor-pointer relative"
                      onClick={() => handleOrderClick(bid.price, bid.cumulativeShares, 'sell')}
                    >
                      <td className="relative">
                        {index === 0 && (
                          <span className="badge badge-outline badge-success badge-lg font-bold border-[#00C805] text-[#00C805] hover:bg-[#00C805]/10 relative z-10">
                            {dict.marketDetail.orderBook.bids}
                          </span>
                        )}
                        <div
                          className="absolute right-0 top-0 h-full bg-success/10"
                          style={{ width: `${getBarWidth(bid.total, maxBidTotal)}%` }}
                        />
                      </td>
                      <td className="text-right font-bold text-success relative">{bid.price}</td>
                      <td className="text-right relative">{bid.shares}</td>
                      <td className="text-right font-medium relative">{bid.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
