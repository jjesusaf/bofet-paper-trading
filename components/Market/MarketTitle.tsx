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
    <div className="flex flex-col gap-3 px-4 py-4 bg-base-100 md:flex-row md:items-center md:gap-4">
      {/* Market Image: negative top margin on mobile to tighten spacing above */}
      <div className="avatar -mt-2 shrink-0 md:mt-0">
        <div className="rounded-lg" style={{ width: imageSize, height: imageSize }}>
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Market Title: own row on mobile below image */}
      <h1 className="text-xl font-bold text-base-content leading-tight break-words md:text-3xl">
        {title}
      </h1>
    </div>
  )
}
