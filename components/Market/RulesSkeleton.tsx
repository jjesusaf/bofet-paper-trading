export default function RulesSkeleton() {
  return (
    <div className="bg-base-100 px-6 py-6">
      {/* Title Skeleton */}
      <div className="skeleton h-8 w-32 mb-4"></div>

      {/* Description Skeleton */}
      <div className="space-y-2 mb-4">
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-full"></div>
        <div className="skeleton h-4 w-3/4"></div>
      </div>

      {/* Show more button Skeleton */}
      <div className="skeleton h-8 w-32 mb-6"></div>
    </div>
  )
}
