export default function MarketTitleSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-4 bg-base-100">
      {/* Image Skeleton */}
      <div className="skeleton w-16 h-16 rounded-lg shrink-0"></div>

      {/* Title Skeleton */}
      <div className="flex-1 space-y-2">
        <div className="skeleton h-8 w-3/4"></div>
        <div className="skeleton h-8 w-1/2"></div>
      </div>
    </div>
  )
}
