'use client'
import { useState } from 'react'
import MarketHeader from './MarketHeader'
import MarketTitle from './MarketTitle'
import ChartSection from './ChartSection'
import OrderBook from './OrderBook'
import Rules from './Rules'
import OpenOrdersPanel from './OpenOrdersPanel'
import TradingButtons from './TradingButtons'
import TradingModal from './TradingModal'
import { formatVolume } from '@/utils/formatting'
import useMarketBySlug from '@/hooks/useMarketBySlug'
import MarketHeaderSkeleton from './SkeletonMarketPage/MarketHeaderSkeleton'
import MarketTitleSkeleton from './SkeletonMarketPage/MarketTitleSkeleton'
import ChartSectionSkeleton from './SkeletonMarketPage/ChartSectionSkeleton'
import OrderBookSkeleton from './SkeletonMarketPage/OrderBookSkeleton'
import RulesSkeleton from './RulesSkeleton'

interface MarketDetailContentProps {
  marketSlug: string
}

export default function MarketDetailContent({ marketSlug }: MarketDetailContentProps) {
  const { data: marketData, isLoading, isError } = useMarketBySlug({ slug: marketSlug })

  // Estados para controlar TradingModal desde OrderBook
  const [tradingModalState, setTradingModalState] = useState<{
    orderType?: 'limit' | 'market'
    outcome?: 'yes' | 'no'
    limitPrice?: number
    tradeType?: 'buy' | 'sell'
    shares?: number
  }>({})

  // Estado para modal en mobile (desde OrderBook)
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)
  const [mobileModalOutcome, setMobileModalOutcome] = useState<'yes' | 'no'>('yes')

  // Handler para clicks en OrderBook
  const handleOrderBookClick = (data: { price: number; outcome: 'yes' | 'no'; side: 'buy' | 'sell'; shares: number }) => {
    setTradingModalState({
      orderType: 'limit',
      outcome: data.outcome,
      limitPrice: data.price,
      tradeType: data.side,
      shares: data.shares,
    })
    // En mobile, abrir el modal
    setMobileModalOutcome(data.outcome)
    setIsMobileModalOpen(true)
  }

  // Handler para cambio de tab en OrderBook
  const handleOrderBookTabChange = (outcome: 'yes' | 'no') => {
    setTradingModalState(prev => ({
      ...prev,
      outcome: outcome,
      // Limpiar limitPrice, shares y orderType cuando se cambia de outcome manualmente
      limitPrice: undefined,
      shares: undefined,
      orderType: undefined,
    }))
  }

  // Handle share functionality
  const handleShare = async () => {
    if (!marketData) return

    // Build URL manually to avoid HTTPS issues in development
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const shareUrl = `${baseUrl}${currentPath}`

    const shareData = {
      url: shareUrl,
    }

    try {
      // Check if Web Share API is available (mobile devices)
      if (navigator.share) {
        // Mobile: Use native share menu
        await navigator.share(shareData)
        console.log('[Share] Shared successfully via native share')
      } else {
        // Desktop: Copy to clipboard silently
        await navigator.clipboard.writeText(shareData.url)
        console.log('[Share] URL copied to clipboard')
      }
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('[Share] Error sharing:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 pb-28 lg:pb-0">
        <MarketHeaderSkeleton />
        <div className="container mx-auto pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
            <div className="lg:col-span-8 space-y-8">
              <MarketTitleSkeleton />
              <ChartSectionSkeleton />
              <RulesSkeleton />
              <OrderBookSkeleton />
              {/* Open Orders Panel placeholder */}
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body p-6">
                  <div className="skeleton h-6 w-40 mb-4" />
                  <div className="space-y-3">
                    <div className="skeleton h-12 w-full" />
                    <div className="skeleton h-12 w-full" />
                    <div className="skeleton h-12 w-3/4" />
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block lg:col-span-4">
              <div className="bg-base-100 rounded-2xl border border-base-300 p-6 h-150 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !marketData) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-base-content mb-2">Market not found</h2>
          <p className="text-base-content/70">The market you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  // Format volume for display
  const volumeNum = parseFloat(marketData.volume || '0')
  const volume = formatVolume(volumeNum)

  const title = marketData.question
  const imageUrl = marketData.icon

  // Format volume24hr for chart
  const volume24hr = formatVolume(
    typeof marketData.volume24hr === 'string'
      ? parseFloat(marketData.volume24hr)
      : marketData.volume24hr || 0
  )

  // Parse outcomes and prices
  const outcomePrices = marketData .outcomePrices ? JSON.parse(marketData.outcomePrices) : ['0.5', '0.5']
  const currentChance = Math.round(parseFloat(outcomePrices[0]) * 100)

  // Calculate change percent from realtime prices if available
  let changePercent = 0
  if (marketData.realtimePrices && marketData.clobTokenIds) {
    const tokenIds = JSON.parse(marketData.clobTokenIds)
    const firstTokenId = tokenIds[0]
    if (marketData.realtimePrices[firstTokenId]) {
      const currentPrice = marketData.realtimePrices[firstTokenId].midPrice
      const originalPrice = parseFloat(outcomePrices[0])
      changePercent = Math.round(((currentPrice - originalPrice) / originalPrice) * 100)
    }
  }

  // Format spread
  const spreadNum = typeof marketData.spread === 'string'
    ? parseFloat(marketData.spread)
    : marketData.spread || 0
  const spreadFormatted = `${(spreadNum * 100).toFixed(1)}¢`

  // Format dates
  const endDate = marketData.endDate
    ? new Date(marketData.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : 'TBD'

  const createdAt = marketData.endDate
    ? new Date(marketData.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }) + ' ET'
    : 'Unknown'

  // Extract first sentence or 100 chars for short description
  const shortDescription = marketData.description
    ? marketData.description.split('.')[0] + '.'
    : 'No description available.'

  // Format prices for trading buttons/modal
  const yesPriceNum = parseFloat(outcomePrices[0])
  const noPriceNum = parseFloat(outcomePrices[1])
  const yesPrice = `${Math.round(yesPriceNum * 100)}¢`
  const noPrice = `${Math.round(noPriceNum * 100)}¢`

  // Generate OrderBook data from real orderBooks or fallback to simulated data
  let yesOrderBook = {
    asks: [] as { price: string; shares: string; total: string; cumulativeShares: number }[],
    bids: [] as { price: string; shares: string; total: string; cumulativeShares: number }[],
    lastPrice: '0.0¢'
  }
  let noOrderBook = {
    asks: [] as { price: string; shares: string; total: string; cumulativeShares: number }[],
    bids: [] as { price: string; shares: string; total: string; cumulativeShares: number }[],
    lastPrice: '0.0¢'
  }

  if (marketData.clobTokenIds) {
    const tokenIds = JSON.parse(marketData.clobTokenIds)

    // YES token (first token)
    const yesTokenId = tokenIds[0]

    // Try to use real OrderBook data first
    if (marketData.orderBooks && marketData.orderBooks[yesTokenId]) {
      const orderBook = marketData.orderBooks[yesTokenId]

      // Set last price from realtimePrices if available
      if (marketData.realtimePrices && marketData.realtimePrices[yesTokenId]) {
        yesOrderBook.lastPrice = `${(marketData.realtimePrices[yesTokenId].midPrice * 100).toFixed(1)}¢`
      }

      // Sort asks ascending by price (closest to midPrice first) and take top 20
      // Check if asks exists and is an array before spreading
      const sortedAsks = (orderBook.asks && Array.isArray(orderBook.asks) ? [...orderBook.asks] : [])
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        .slice(0, 20)

      // Calculate cumulative totals and shares for asks
      let cumulativeAskTotal = 0
      let cumulativeAskShares = 0
      yesOrderBook.asks = sortedAsks.map(order => {
        const priceNum = parseFloat(order.price) * 100
        const sizeNum = parseFloat(order.size)
        const orderTotal = priceNum * sizeNum / 100
        cumulativeAskTotal += orderTotal
        cumulativeAskShares += sizeNum
        return {
          price: `${priceNum.toFixed(1)}¢`,
          shares: sizeNum.toLocaleString('en-US', { maximumFractionDigits: 0 }),
          total: `$${cumulativeAskTotal.toFixed(2)}`,
          cumulativeShares: Math.round(cumulativeAskShares)
        }
      }).reverse() // Reverse so closest price to midPrice is at bottom (near Last Price badge)

      // Sort bids descending by price (closest to midPrice first) and take top 20
      // Check if bids exists and is an array before spreading
      const sortedBids = (orderBook.bids && Array.isArray(orderBook.bids) ? [...orderBook.bids] : [])
        .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        .slice(0, 20)

      // Calculate cumulative totals and shares for bids
      let cumulativeBidTotal = 0
      let cumulativeBidShares = 0
      yesOrderBook.bids = sortedBids.map(order => {
        const priceNum = parseFloat(order.price) * 100
        const sizeNum = parseFloat(order.size)
        const orderTotal = priceNum * sizeNum / 100
        cumulativeBidTotal += orderTotal
        cumulativeBidShares += sizeNum
        return {
          price: `${priceNum.toFixed(1)}¢`,
          shares: sizeNum.toLocaleString('en-US', { maximumFractionDigits: 0 }),
          total: `$${cumulativeBidTotal.toFixed(2)}`,
          cumulativeShares: Math.round(cumulativeBidShares)
        }
      })
    }
    // Fallback to simulated data if no real OrderBook
    else if (marketData.realtimePrices && marketData.realtimePrices[yesTokenId]) {
      const prices = marketData.realtimePrices[yesTokenId]
      yesOrderBook.lastPrice = `${(prices.midPrice * 100).toFixed(1)}¢`

      const askPrice = prices.askPrice * 100
      yesOrderBook.asks = [
        { price: `${(askPrice + 0.5).toFixed(1)}¢`, shares: '10,000', total: `$${((askPrice + 0.5) * 100).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(askPrice + 0.4).toFixed(1)}¢`, shares: '8,500', total: `$${((askPrice + 0.4) * 85).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(askPrice + 0.3).toFixed(1)}¢`, shares: '7,200', total: `$${((askPrice + 0.3) * 72).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(askPrice + 0.2).toFixed(1)}¢`, shares: '5,800', total: `$${((askPrice + 0.2) * 58).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${askPrice.toFixed(1)}¢`, shares: '4,500', total: `$${(askPrice * 45).toFixed(2)}`, cumulativeShares: 0 },
      ]

      const bidPrice = prices.bidPrice * 100
      yesOrderBook.bids = [
        { price: `${bidPrice.toFixed(1)}¢`, shares: '12,000', total: `$${(bidPrice * 120).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(bidPrice - 0.1).toFixed(1)}¢`, shares: '9,500', total: `$${((bidPrice - 0.1) * 95).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(bidPrice - 0.2).toFixed(1)}¢`, shares: '7,800', total: `$${((bidPrice - 0.2) * 78).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(bidPrice - 0.3).toFixed(1)}¢`, shares: '6,200', total: `$${((bidPrice - 0.3) * 62).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(bidPrice - 0.4).toFixed(1)}¢`, shares: '5,000', total: `$${((bidPrice - 0.4) * 50).toFixed(2)}`, cumulativeShares: 0 },
      ]
    }

    // NO token (second token)
    const noTokenId = tokenIds[1]

    // Try to use real OrderBook data first
    if (noTokenId && marketData.orderBooks && marketData.orderBooks[noTokenId]) {
      const orderBook = marketData.orderBooks[noTokenId]

      // Set last price from realtimePrices if available
      if (marketData.realtimePrices && marketData.realtimePrices[noTokenId]) {
        noOrderBook.lastPrice = `${(marketData.realtimePrices[noTokenId].midPrice * 100).toFixed(1)}¢`
      }

      // Sort asks ascending by price (closest to midPrice first) and take top 20
      const sortedAsks = [...orderBook.asks]
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        .slice(0, 20)

      // Calculate cumulative totals and shares for asks
      let cumulativeNoAskTotal = 0
      let cumulativeNoAskShares = 0
      noOrderBook.asks = sortedAsks.map(order => {
        const priceNum = parseFloat(order.price) * 100
        const sizeNum = parseFloat(order.size)
        const orderTotal = priceNum * sizeNum / 100
        cumulativeNoAskTotal += orderTotal
        cumulativeNoAskShares += sizeNum
        return {
          price: `${priceNum.toFixed(1)}¢`,
          shares: sizeNum.toLocaleString('en-US', { maximumFractionDigits: 0 }),
          total: `$${cumulativeNoAskTotal.toFixed(2)}`,
          cumulativeShares: Math.round(cumulativeNoAskShares)
        }
      }).reverse() // Reverse so closest price to midPrice is at bottom (near Last Price badge)

      // Sort bids descending by price (closest to midPrice first) and take top 20
      // Check if bids exists and is an array before spreading
      const sortedBids = (orderBook.bids && Array.isArray(orderBook.bids) ? [...orderBook.bids] : [])
        .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        .slice(0, 20)

      // Calculate cumulative totals and shares for bids
      let cumulativeNoBidTotal = 0
      let cumulativeNoBidShares = 0
      noOrderBook.bids = sortedBids.map(order => {
        const priceNum = parseFloat(order.price) * 100
        const sizeNum = parseFloat(order.size)
        const orderTotal = priceNum * sizeNum / 100
        cumulativeNoBidTotal += orderTotal
        cumulativeNoBidShares += sizeNum
        return {
          price: `${priceNum.toFixed(1)}¢`,
          shares: sizeNum.toLocaleString('en-US', { maximumFractionDigits: 0 }),
          total: `$${cumulativeNoBidTotal.toFixed(2)}`,
          cumulativeShares: Math.round(cumulativeNoBidShares)
        }
      })
    }
    // Fallback to simulated data if no real OrderBook
    else if (noTokenId && marketData.realtimePrices && marketData.realtimePrices[noTokenId]) {
      const prices = marketData.realtimePrices[noTokenId]
      noOrderBook.lastPrice = `${(prices.midPrice * 100).toFixed(1)}¢`

      const askPrice = prices.askPrice * 100
      noOrderBook.asks = [
        { price: `${(askPrice + 0.5).toFixed(1)}¢`, shares: '9,500', total: `$${((askPrice + 0.5) * 95).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(askPrice + 0.4).toFixed(1)}¢`, shares: '8,200', total: `$${((askPrice + 0.4) * 82).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(askPrice + 0.3).toFixed(1)}¢`, shares: '6,800', total: `$${((askPrice + 0.3) * 68).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(askPrice + 0.2).toFixed(1)}¢`, shares: '5,400', total: `$${((askPrice + 0.2) * 54).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${askPrice.toFixed(1)}¢`, shares: '4,200', total: `$${(askPrice * 42).toFixed(2)}`, cumulativeShares: 0 },
      ]

      const bidPrice = prices.bidPrice * 100
      noOrderBook.bids = [
        { price: `${bidPrice.toFixed(1)}¢`, shares: '11,500', total: `$${(bidPrice * 115).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(bidPrice - 0.1).toFixed(1)}¢`, shares: '9,200', total: `$${((bidPrice - 0.1) * 92).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(bidPrice - 0.2).toFixed(1)}¢`, shares: '7,500', total: `$${((bidPrice - 0.2) * 75).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(bidPrice - 0.3).toFixed(1)}¢`, shares: '6,000', total: `$${((bidPrice - 0.3) * 60).toFixed(2)}`, cumulativeShares: 0 },
        { price: `${(bidPrice - 0.4).toFixed(1)}¢`, shares: '4,800', total: `$${((bidPrice - 0.4) * 48).toFixed(2)}`, cumulativeShares: 0 },
      ]
    }
  }

  return (
    <div className="min-h-screen bg-base-200 pb-8 lg:pb-0">
      {/* Market Header */}
      <MarketHeader onShare={handleShare} />
      {/* Fixed Trading Buttons - Only on mobile */}
      <div className="lg:hidden">
        <TradingButtons
          yesPrice={yesPrice}
          noPrice={noPrice}
          yesPriceNum={yesPriceNum}
          noPriceNum={noPriceNum}
          marketTitle={title}
          marketImage={imageUrl}
          yesTokenId={marketData.clobTokenIds ? JSON.parse(marketData.clobTokenIds)[0] : undefined}
          noTokenId={marketData.clobTokenIds ? JSON.parse(marketData.clobTokenIds)[1] : undefined}
          negRisk={marketData.negRisk}
        />

        {/* Trading Modal para OrderBook clicks en mobile */}
        <TradingModal
          isOpen={isMobileModalOpen}
          onClose={() => setIsMobileModalOpen(false)}
          marketTitle={title}
          marketImage={imageUrl}
          yesPrice={yesPriceNum}
          noPrice={noPriceNum}
          yesTokenId={marketData.clobTokenIds ? JSON.parse(marketData.clobTokenIds)[0] : undefined}
          noTokenId={marketData.clobTokenIds ? JSON.parse(marketData.clobTokenIds)[1] : undefined}
          negRisk={marketData.negRisk}
          selectedOutcome={mobileModalOutcome}
          externalOrderType={tradingModalState.orderType}
          externalOutcome={tradingModalState.outcome}
          externalLimitPrice={tradingModalState.limitPrice}
          externalTradeType={tradingModalState.tradeType}
          externalShares={tradingModalState.shares}
        />
      </div>

      <div className="container mx-auto pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
          {/* Left Column: Title + Chart + OrderBook + Rules + Tabs (on desktop takes 8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Market Title */}
            <MarketTitle
              title={title}
              imageUrl={imageUrl}
              imageSize={64}
            />

            {/* Chart Section */}
            <ChartSection
              tokenId={marketData.clobTokenIds ? JSON.parse(marketData.clobTokenIds)[0] : undefined}
              currentChance={currentChance}
              changePercent={changePercent}
              volume={volume24hr}
              defaultTimeframe="1W"
            />

   {/* Rules */}
   <Rules
              shortDescription={shortDescription}
              fullDescription={marketData.description || shortDescription}
              volume={volume}
              endDate={endDate}
              createdAt={createdAt}
              //resolverName="UMA"
              //resolverAddress={marketData.id || '0x...'}
            />
            {/* Order Book */}
            <OrderBook
              isExpanded={true}
              lastPrice={yesOrderBook.lastPrice}
              spread={spreadFormatted}
              asks={yesOrderBook.asks}
              bids={yesOrderBook.bids}
              yesOrderBook={yesOrderBook}
              noOrderBook={noOrderBook}
              onOrderClick={handleOrderBookClick}
              onTabChange={handleOrderBookTabChange}
              selectedTab={tradingModalState.outcome}
            />

         

            {/* Open Orders Panel */}
            <OpenOrdersPanel
              tokenIds={marketData.clobTokenIds ? JSON.parse(marketData.clobTokenIds) : undefined}
            />

            {/* <div className="mb-4"> */}
            {/* <MarketTabs /> */}
            {/* </div> */}
          </div>

          {/* Right Column: Trading Modal (only on desktop, takes 4 cols) */}
          <div className="hidden lg:block lg:col-span-4">
            <TradingModal
              marketTitle={title}
              marketImage={imageUrl}
              yesPrice={yesPriceNum}
              noPrice={noPriceNum}
              yesTokenId={marketData.clobTokenIds ? JSON.parse(marketData.clobTokenIds)[0] : undefined}
              noTokenId={marketData.clobTokenIds ? JSON.parse(marketData.clobTokenIds)[1] : undefined}
              negRisk={marketData.negRisk}
              externalOrderType={tradingModalState.orderType}
              externalOutcome={tradingModalState.outcome}
              externalLimitPrice={tradingModalState.limitPrice}
              externalTradeType={tradingModalState.tradeType}
              externalShares={tradingModalState.shares}
              onOutcomeChange={handleOrderBookTabChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
