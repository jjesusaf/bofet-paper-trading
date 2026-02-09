interface MarketTitleProps {
  imageUrl?: string
  title?: string
  imageSize?: number
}

export default function MarketTitle({
  imageUrl,
  title,
  imageSize,
}: MarketTitleProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-4 bg-base-100">
      {/* Market Image */}
      <div
        className="avatar shrink-0"
      >
        <div className="rounded-lg" style={{ width: imageSize, height: imageSize }}>
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Market Title */}
      <h1 className="text-3xl font-bold text-base-content leading-tight">
        {title}
      </h1>
    </div>
  )
}
