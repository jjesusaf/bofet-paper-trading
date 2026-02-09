'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDictionary } from '@/providers/dictionary-provider'

interface SearchResult {
  id: string
  category: string
  title: string
  description: string
  highlights?: string[]
  metadata?: {
    slug?: string
    volume?: string
    liquidity?: string
    icon?: string
    image?: string
  }
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSearch?: (query: string) => void
  results?: SearchResult[]
  placeholder?: string
  isSearching?: boolean
}

export default function SearchModal({
  isOpen,
  onClose,
  onSearch,
  results = [],
  placeholder = 'Search',
  isSearching = false,
}: SearchModalProps) {
  const router = useRouter()
  const { locale } = useDictionary()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const modalRef = useRef<HTMLDialogElement>(null)
  const onSearchRef = useRef(onSearch)

  const filters = ['All', 'Markets', 'Tags']

  // Keep onSearchRef updated
  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  // Open/Close modal when isOpen changes
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.showModal()
      setQuery('')
      setFilter('All')
    } else if (!isOpen && modalRef.current) {
      modalRef.current.close()
    }
  }, [isOpen])

  // Handle modal close
  useEffect(() => {
    const handleClose = () => {
      onClose()
    }

    const modal = modalRef.current
    if (modal) {
      modal.addEventListener('close', handleClose)
      return () => modal.removeEventListener('close', handleClose)
    }
  }, [onClose])

  // Debounced search - wait 500ms after user stops typing
  useEffect(() => {
    // Only search if query has at least 2 characters
    if (onSearchRef.current && query && query.trim().length >= 2) {
      const debounce = setTimeout(() => {
        onSearchRef.current?.(query)
      }, 500)
      return () => clearTimeout(debounce)
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      modalRef.current?.close()
    }
  }

  const handleResultClick = (result: SearchResult) => {
    // Close modal
    modalRef.current?.close()

    // Navigate based on category and metadata
    if (result.category === 'Market' && result.metadata?.slug) {
      // Navigate to market detail page
      router.push(`/${locale || 'es'}/market/${result.metadata.slug}`)
    } else if (result.category === 'Tag' && result.metadata?.slug) {
      // Navigate to tag/category page (can be implemented later)
      console.log('Tag clicked:', result.metadata.slug)
      // router.push(`/${locale || 'es'}/tag/${result.metadata.slug}`)
    }
  }

  const highlightText = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text

    let result = text
    highlights.forEach((highlight) => {
      const regex = new RegExp(`(${highlight})`, 'gi')
      result = result.replace(
        regex,
        '<mark class="bg-warning text-warning-content">$1</mark>'
      )
    })

    return <span dangerouslySetInnerHTML={{ __html: result }} />
  }

  return (
    <dialog
      ref={modalRef}
      className="modal items-start pt-16 sm:items-start sm:pt-24"
      onKeyDown={handleKeyDown}
    >
      <div className="modal-box max-w-2xl p-0 mt-0 overflow-visible">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-base-300">
          <label className="input input-ghost flex items-center gap-3 flex-1 focus-within:outline-none">
            <svg
              className="h-5 w-5 opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path
                d="M21 21L16.65 16.65"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="grow"
              autoFocus
            />
          </label>

          <kbd className="kbd kbd-sm">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {query === '' || query.trim().length < 2 ? (
            // Empty state
            <div className="p-8 text-center opacity-40">
              <p className="text-sm">Type at least 2 characters to search...</p>
            </div>
          ) : isSearching ? (
            // Loading state
            <div className="p-8 text-center">
              <span className="loading loading-spinner loading-md"></span>
              <p className="text-sm mt-2 opacity-40">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            // No results
            <div className="p-8 text-center opacity-40">
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          ) : (
            // Results list
            <div className="py-2">
              {results
                .filter((result) => filter === 'All' || result.category === filter)
                .map((result, index) => (
                  <button
                    key={`${result.category}-${result.id}-${index}`}
                    className="w-full px-4 py-3 text-left hover:bg-base-200 transition-colors flex gap-3"
                    onClick={() => handleResultClick(result)}
                  >
                    {/* Image - Try both icon and image fields */}
                    {(result.metadata?.icon || result.metadata?.image) && (
                      <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-base-300 flex items-center justify-center">
                        <img
                          src={result.metadata.icon || result.metadata.image}
                          alt={result.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const parent = e.currentTarget.parentElement
                            if (parent) {
                              parent.style.display = 'none'
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Category Badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge badge-sm ${result.category === 'Market'
                            ? 'badge-primary'
                            : 'badge-secondary'
                          }`}>
                          {result.category}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="text-base font-bold mb-1 line-clamp-1">
                        {highlightText(result.title, result.highlights)}
                      </div>

                      {/* Description - Now shows volume & liquidity */}
                      <div className="text-sm opacity-70 line-clamp-1">
                        {result.description}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Filter and Attribution - Moved to bottom */}
        <div className="flex items-center justify-between px-4 py-2 bg-base-200 border-t border-base-300">
          {/**      <div className="dropdown dropdown-bottom">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-sm gap-2"
            >
              <span className="font-medium">Filter</span>
              <span className="font-bold">{filter}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-9999 w-52 p-2 shadow-lg border border-base-300 mt-1"
            >
              {filters.map((f) => (
                <li key={f}>
                  <a
                    onClick={() => setFilter(f)}
                    className={filter === f ? 'active' : ''}
                  >
                    {f}
                  </a>
                </li>
              ))}
            </ul>
          </div> */}


          <span className="text-xs opacity-40">Powered by Bofet</span>
        </div>
      </div>

      {/* Backdrop - closes modal when clicked */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  )
}
