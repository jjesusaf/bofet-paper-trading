'use client'

import { useRouter } from 'next/navigation'
import { useDictionary } from '@/providers/dictionary-provider'

interface MarketHeaderProps {
  //volume?: string
  onBookmark?: () => void
  onShare?: () => void
}

export default function MarketHeader({
  //volume = '$70,926,828',
  onBookmark,
  onShare,
}: MarketHeaderProps) {
  const router = useRouter()
  const { dict } = useDictionary()

  const handleBack = () => {
    router.back()
  }

  const handleBookmark = () => {
    if (onBookmark) {
      onBookmark()
    } else {
      // Default bookmark behavior
      console.log('Bookmark clicked')
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare()
    } else {
      // Default share behavior
      console.log('Share clicked')
    }
  }

  return (
    <div className="w-full py-3 bg-transparent">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="btn btn-ghost btn-circle bg-transparent hover:bg-base-200/80"
        aria-label={dict.marketDetail.header.goBack}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18L9 12L15 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>


      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Save/Bookmark - commented out
        <button
          onClick={handleBookmark}
          className="btn btn-ghost btn-circle bg-transparent hover:bg-base-200/80"
          aria-label={dict.marketDetail.header.bookmark}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        */}

        {/* Share Button (Share2 style) */}
        <button
          onClick={handleShare}
          className="btn btn-ghost btn-circle bg-transparent hover:bg-base-200/80"
          aria-label={dict.marketDetail.header.share}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      </div>
    </div>
  )
}
