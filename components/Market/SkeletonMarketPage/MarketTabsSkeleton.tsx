export default function MarketTabsSkeleton() {
  return (
    <div className="bg-base-100">
      {/* Tabs Header Skeleton */}
      <div className="flex items-center border-b border-base-300 px-6 gap-4">
        <div className="skeleton h-10 w-24"></div>
        <div className="skeleton h-10 w-24"></div>
        <div className="skeleton h-10 w-24"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        {/* Comment Input Skeleton */}
        <div className="mb-6">
          <div className="skeleton h-12 w-full"></div>
        </div>

        {/* Warning Banner Skeleton */}
        <div className="skeleton h-12 w-full mb-6"></div>

        {/* Sort and Filter Skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="skeleton h-8 w-24"></div>
          <div className="skeleton h-6 w-20"></div>
        </div>

        {/* Comments List Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-12 h-12 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="skeleton h-4 w-24"></div>
                  <div className="skeleton h-4 w-16"></div>
                </div>
                <div className="skeleton h-4 w-full"></div>
                <div className="skeleton h-4 w-3/4"></div>
                <div className="skeleton h-6 w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
