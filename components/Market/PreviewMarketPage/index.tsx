'use client'

import { useRouter } from 'next/navigation'
import MarketHeader from '../MarketHeader'
import MarketTitle from '../MarketTitle'
import Rules from '../Rules'
import ChartSectionPreview from './ChartSectionPreview'
import OrderBookPreview from './OrderBookPreview'
import TradingButtonsPreview from './TradingButtonsPreview'
import TradingModalPreview from './TradingModalPreview'
import { formatVolume } from '@/utils/formatting'
import { useState, useEffect } from 'react'
import MarketHeaderSkeleton from '../SkeletonMarketPage/MarketHeaderSkeleton'
import MarketTitleSkeleton from '../SkeletonMarketPage/MarketTitleSkeleton'
import ChartSectionSkeleton from '../SkeletonMarketPage/ChartSectionSkeleton'
import OrderBookSkeleton from '../SkeletonMarketPage/OrderBookSkeleton'
import RulesSkeleton from '../RulesSkeleton'
import { useWallet } from '@/providers/WalletContext'


interface MarketDetailPreviewProps {
  marketSlug: string
}

export default function MarketDetailPreview({ marketSlug }: MarketDetailPreviewProps) {
  const router = useRouter()
  const [marketData, setMarketData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const { connect } = useWallet()
  // Fetch market data with preview=true
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `/api/polymarket/market-by-slug?slug=${encodeURIComponent(marketSlug)}&preview=true`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch market')
        }

        const data = await response.json()
        setMarketData(data)
        setIsError(false)
      } catch (error) {
        console.error('Error fetching market:', error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    if (marketSlug) {
      fetchMarket()
    }
  }, [marketSlug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 pb-28 lg:pb-0">
        <MarketHeaderSkeleton />
        <div className="container mx-auto pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
            <div className="lg:col-span-8 space-y-8">
              <MarketTitleSkeleton />
              <ChartSectionSkeleton />
              <OrderBookSkeleton />
              <RulesSkeleton />
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

  // Format dates
  const endDate = marketData.endDate
    ? new Date(marketData.endDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : 'Unknown'

  const createdAt = marketData.createdAt
    ? new Date(marketData.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    : 'Unknown'

  // Description with translations
  const description = marketData.description || ''

  // CTA for login
  const handleLoginClick = async () => {
    await connect()
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

  return (
    <div className="min-h-screen bg-base-200 pb-28 lg:pb-0 ">
      {/* Market Header - Navigation only */}
      <MarketHeader onShare={handleShare} />

      {/* Main Content */}
      <div className="container mx-auto pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-4">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Market Title with Image */}
            <MarketTitle
              title={title}
              imageUrl={imageUrl}
              imageSize={80}
            />
            {/* CTA to Login */}
            <div className="bg-linear-to-r from-green-50 to-green-100 border-2 border-green-500 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ¿Listo para operar?
              </h3>
              <p className="text-gray-700 mb-6">
                Inicia sesión para ver gráficos en tiempo real, el libro de órdenes completo y comenzar a operar.
              </p>
              <button
                onClick={handleLoginClick}
                className="btn bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-full text-lg border-none"
              >
                Iniciar Sesión
              </button>
            </div>
            {/* Chart Section - Preview with blur (reduced height) */}
            <div className="h-50 overflow-hidden relative">
              <ChartSectionPreview />
            </div>

            {/* Order Book - Preview with blur (reduced) */}
            <div className="h-50 overflow-hidden relative">
              <OrderBookPreview />
            </div>

            {/* Rules - Full component */}
            <Rules
              fullDescription={description}
              volume={volume}
              endDate={endDate}
              createdAt={createdAt}
            />


          </div>

          {/* Right Column - Trading Modal (Preview) */}
          <div className="hidden lg:block lg:col-span-4">
            <TradingModalPreview
              marketTitle={title}
              marketImage={imageUrl}
            />
          </div>
        </div>
      </div>

      {/* Fixed Trading Buttons at Bottom (Mobile/Tablet) - Preview */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
        <TradingButtonsPreview />
      </div>
    </div>
  )
}
