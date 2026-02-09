'use client'

import { useDictionary } from '@/providers/dictionary-provider'

interface RulesProps {
  title?: string
  shortDescription?: string
  fullDescription?: string
  volume?: string
  endDate?: string
  createdAt?: string
  resolverName?: string
  resolverAddress?: string
}

export default function Rules({
  title,
  //shortDescription,
  fullDescription,
  volume,
  endDate,
  createdAt,
  //resolverName,
  //resolverAddress,
}: RulesProps) {
  const { dict } = useDictionary()

  return (
    <div className="bg-base-100 px-6 py-6">
      {/* Title */}
      <h2 className="text-2xl font-bold text-base-content mb-4">{title || dict.marketDetail.rules.title}</h2>

      {/* Description - always full */}
      <div className="text-base text-base-content leading-relaxed mb-6 whitespace-pre-line break-words overflow-wrap-anywhere">
        {fullDescription}
      </div>

      {/* Market Details - always visible */}
      <div className="space-y-4 mb-6">
          {/* Volume */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="18" fill="currentColor" className="text-primary"/>
                <rect x="13" y="8" width="7" height="13" fill="currentColor" className="text-primary"/>
              </svg>
              <span className="text-base font-semibold text-base-content">{dict.marketDetail.rules.volume}</span>
            </div>
            <span className="text-base font-bold text-base-content">{volume}</span>
          </div>

          {/* End Date */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" fill="currentColor" className="text-primary"/>
                <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-base font-semibold text-base-content">{dict.marketDetail.rules.endDate}</span>
            </div>
            <span className="text-base font-bold text-base-content">{endDate}</span>
          </div>

          {/* Created At */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" fill="currentColor" className="text-primary"/>
                <path d="M12 7V12H17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="text-base font-semibold text-base-content">{dict.marketDetail.rules.createdAt}</span>
            </div>
            <span className="text-base font-bold text-base-content">{createdAt}</span>
          </div>

      </div>
    </div>
  )
}
