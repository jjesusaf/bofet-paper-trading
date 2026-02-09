import MarketHeaderSkeleton from '@/components/Market/SkeletonMarketPage/MarketHeaderSkeleton'
import MarketTitleSkeleton from '@/components/Market/SkeletonMarketPage/MarketTitleSkeleton'
import ChartSectionSkeleton from '@/components/Market/SkeletonMarketPage/ChartSectionSkeleton'
import OrderBookSkeleton from '@/components/Market/SkeletonMarketPage/OrderBookSkeleton'
import RulesSkeleton from '@/components/Market/RulesSkeleton'
import MarketTabsSkeleton from '@/components/Market/SkeletonMarketPage/MarketTabsSkeleton'

export default function MarketPageLoading() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Market Header Skeleton */}
      <MarketHeaderSkeleton />

      {/* Market Title Skeleton */}
      <MarketTitleSkeleton />

      {/* Chart Section Skeleton */}
      <ChartSectionSkeleton />

      {/* Order Book Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <OrderBookSkeleton />
      </div>

      {/* Rules Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <RulesSkeleton />
      </div>

      {/* Market Tabs Skeleton */}
      <div className="container mx-auto px-4 py-8">
        <MarketTabsSkeleton />
      </div>
    </div>
  )
}
