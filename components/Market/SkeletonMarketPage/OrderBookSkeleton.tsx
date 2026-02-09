export default function OrderBookSkeleton() {
  return (
    <div className="bg-base-100 rounded-2xl border border-base-300 overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-base-300">
        <div className="skeleton h-8 w-32"></div>
        <div className="skeleton w-8 h-8 rounded-full"></div>
      </div>

      {/* Tabs and Refresh Skeleton */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex gap-4">
          <div className="skeleton h-6 w-24"></div>
          <div className="skeleton h-6 w-24"></div>
        </div>
        <div className="skeleton h-5 w-16"></div>
      </div>

      {/* Table Headers Skeleton */}
      <div className="px-6">
        <div className="grid grid-cols-12 gap-4 mb-2">
          <div className="col-span-3 skeleton h-4 w-24"></div>
          <div className="col-span-3 skeleton h-4 w-16"></div>
          <div className="col-span-3 skeleton h-4 w-16"></div>
          <div className="col-span-3 skeleton h-4 w-16"></div>
        </div>

        {/* Asks Section Skeleton */}
        <div className="mb-4">
          <div className="skeleton h-6 w-16 mb-3"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-2">
              <div className="skeleton h-12 w-full"></div>
            </div>
          ))}
        </div>

        {/* Last Price & Spread Skeleton */}
        <div className="flex items-center justify-between py-3 border-y border-base-300 mb-4">
          <div className="skeleton h-5 w-24"></div>
          <div className="skeleton h-5 w-24"></div>
        </div>

        {/* Bids Section Skeleton */}
        <div className="pb-6">
          <div className="skeleton h-6 w-16 mb-3"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="mb-2">
              <div className="skeleton h-12 w-full"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
