export default function MarketHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between w-full px-4 py-3 bg-transparent border-b border-base-300/60">
      {/* Back Button Skeleton */}
      <div className="skeleton w-10 h-10 rounded-full"></div>

      {/* Volume Display Skeleton */}
      <div className="flex items-center gap-1">
        <div className="skeleton h-6 w-32"></div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex items-center gap-2">
        <div className="skeleton w-10 h-10 rounded-full"></div>
        <div className="skeleton w-10 h-10 rounded-full"></div>
      </div>
    </div>
  )
}
