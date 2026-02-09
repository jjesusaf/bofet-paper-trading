export default function ChartSectionSkeleton() {
  return (
    <div className="w-full bg-base-100 p-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="skeleton h-10 w-20"></div>
          <div className="skeleton h-6 w-16"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="skeleton h-4 w-20"></div>
          <div className="skeleton w-6 h-6 rounded-full"></div>
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="skeleton w-full h-64 mb-4"></div>

      {/* Bottom section Skeleton */}
      <div className="flex items-center justify-between">
        {/* Volume Skeleton */}
        <div className="skeleton h-5 w-32"></div>

        {/* Timeframe selector + Settings Skeleton */}
        <div className="flex items-center gap-2">
          <div className="join">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton join-item w-12 h-8"></div>
            ))}
          </div>
          <div className="skeleton w-8 h-8 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}
