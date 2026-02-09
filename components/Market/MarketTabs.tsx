'use client'

import { useState } from 'react'
import { useDictionary } from '@/providers/dictionary-provider'

interface Comment {
  id: string
  username: string
  avatar: string
  timestamp: string
  content: string
  likes: number
  badge?: {
    text: string
    date: string
  }
}

interface Holder {
  rank: number
  username: string
  avatar: string
  shares: string
  isYes: boolean
}

interface ActivityItem {
  id: string
  username: string
  avatar: string
  action: 'bought' | 'sold'
  amount: string
  outcome: 'Yes' | 'No'
  price: string
  total: string
  timestamp: string
}

interface MarketTabsProps {
  comments?: Comment[]
  yesHolders?: Holder[]
  noHolders?: Holder[]
  activityItems?: ActivityItem[]
}

export default function MarketTabs({
  comments = [
    {
      id: '1',
      username: 'Nanamo613',
      avatar: 'https://via.placeholder.com/48',
      timestamp: '49m ago',
      content: 'All you "by January 27" holders sell at 2.4 and buy "on January 26" for 0.9 this market is so strange',
      likes: 1,
    },
    {
      id: '2',
      username: 'Nanamo613',
      avatar: 'https://via.placeholder.com/48',
      timestamp: '51m ago',
      content: 'All you "By January 27" holders',
      likes: 0,
    },
    {
      id: '3',
      username: 'shitten',
      avatar: 'https://via.placeholder.com/48',
      timestamp: '1h ago',
      content: "it's funny to see fake and alt accounts of some whales trying to make people buy YES to lower their loss (im not a native English speaker)",
      likes: 0,
      badge: {
        text: '122 January 31',
        date: 'January 31',
      },
    },
  ],
  yesHolders = [
    { rank: 1, username: 'chungguskhan', avatar: 'https://via.placeholder.com/48', shares: '203,861 shares', isYes: true },
    { rank: 2, username: 'slight-', avatar: 'https://via.placeholder.com/48', shares: '157,075 shares', isYes: true },
    { rank: 3, username: 'Fusion1', avatar: 'https://via.placeholder.com/48', shares: '104,500 shares', isYes: true },
    { rank: 4, username: 'ebxx', avatar: 'https://via.placeholder.com/48', shares: '100,870 shares', isYes: true },
    { rank: 5, username: 'surf', avatar: 'https://via.placeholder.com/48', shares: '73,589 shares', isYes: true },
    { rank: 6, username: 'betwick', avatar: 'https://via.placeholder.com/48', shares: '41,994 shares', isYes: true },
    { rank: 7, username: 'UpDownUpDown', avatar: 'https://via.placeholder.com/48', shares: '37,778 shares', isYes: true },
    { rank: 8, username: 'Repentant-Turnip', avatar: 'https://via.placeholder.com/48', shares: '33,021 shares', isYes: true },
    { rank: 9, username: 'Treadmilled', avatar: 'https://via.placeholder.com/48', shares: '27,000 shares', isYes: true },
    { rank: 10, username: 'Ukkksss', avatar: 'https://via.placeholder.com/48', shares: '25,123 shares', isYes: true },
  ],
  noHolders = [
    { rank: 1, username: 'Morningstar22', avatar: 'https://via.placeholder.com/48', shares: '140,884 shares', isYes: false },
    { rank: 2, username: 'anoin123', avatar: 'https://via.placeholder.com/48', shares: '115,805 shares', isYes: false },
    { rank: 3, username: 'drdre26', avatar: 'https://via.placeholder.com/48', shares: '113,739 shares', isYes: false },
    { rank: 4, username: 'Gtno', avatar: 'https://via.placeholder.com/48', shares: '112,699 shares', isYes: false },
    { rank: 5, username: 'kvento', avatar: 'https://via.placeholder.com/48', shares: '105,502 shares', isYes: false },
    { rank: 6, username: 'Thin-Print', avatar: 'https://via.placeholder.com/48', shares: '98,744 shares', isYes: false },
    { rank: 7, username: 'SwissMiss', avatar: 'https://via.placeholder.com/48', shares: '91,593 shares', isYes: false },
    { rank: 8, username: 'helloaki', avatar: 'https://via.placeholder.com/48', shares: '67,960 shares', isYes: false },
    { rank: 9, username: 'Contrarian-7451', avatar: 'https://via.placeholder.com/48', shares: '60,066 shares', isYes: false },
    { rank: 10, username: 'user211111111111', avatar: 'https://via.placeholder.com/48', shares: '55,321 shares', isYes: false },
  ],
  activityItems = [
    { id: '1', username: 'QuickThunder...', avatar: 'https://via.placeholder.com/48', action: 'bought', amount: '14', outcome: 'No', price: '99.5¢', total: '$14', timestamp: '1s ago' },
    { id: '2', username: 'Fsinatra', avatar: 'https://via.placeholder.com/48', action: 'sold', amount: '58', outcome: 'Yes', price: '54.0¢', total: '$31', timestamp: '7m ago' },
    { id: '3', username: 'CourageousWa...', avatar: 'https://via.placeholder.com/48', action: 'bought', amount: '14', outcome: 'No', price: '99.5¢', total: '$14', timestamp: '7m ago' },
    { id: '4', username: 'ddogoto', avatar: 'https://via.placeholder.com/48', action: 'bought', amount: '788', outcome: 'No', price: '99.5¢', total: '$784', timestamp: '7m ago' },
    { id: '5', username: 'roebl', avatar: 'https://via.placeholder.com/48', action: 'sold', amount: '9', outcome: 'Yes', price: '42.0¢', total: '$4', timestamp: '7m ago' },
    { id: '6', username: 'robinsonvict...', avatar: 'https://via.placeholder.com/48', action: 'sold', amount: '3', outcome: 'No', price: '45.0¢', total: '$1', timestamp: '7m ago' },
    { id: '7', username: 'Vague-Tabby', avatar: 'https://via.placeholder.com/48', action: 'bought', amount: '71', outcome: 'Yes', price: '28.0¢', total: '$20', timestamp: '8m ago' },
    { id: '8', username: 'Vague-Tabby', avatar: 'https://via.placeholder.com/48', action: 'bought', amount: '42', outcome: 'Yes', price: '12.0¢', total: '$5', timestamp: '8m ago' },
    { id: '9', username: 'altaybanyan9...', avatar: 'https://via.placeholder.com/48', action: 'sold', amount: '300', outcome: 'Yes', price: '54.0¢', total: '$162', timestamp: '8m ago' },
  ],
}: MarketTabsProps) {
  const { dict } = useDictionary()
  const [activeTab, setActiveTab] = useState<'comments' | 'holders' | 'activity'>('comments')
  const [sortBy, setSortBy] = useState(dict.marketDetail.tabs.newest)
  const [showHoldersOnly, setShowHoldersOnly] = useState(false)

  return (
    <div className="bg-base-100">
      {/* Tabs Header */}
      <div role="tablist" className="tabs tabs-bordered border-b border-base-300 px-6">
        <button
          role="tab"
          onClick={() => setActiveTab('comments')}
          className={`tab tab-lg font-semibold ${activeTab === 'comments' ? 'tab-active' : ''}`}
        >
          {dict.marketDetail.tabs.comments}
        </button>
        <button
          role="tab"
          onClick={() => setActiveTab('holders')}
          className={`tab tab-lg font-semibold ${activeTab === 'holders' ? 'tab-active' : ''}`}
        >
          {dict.marketDetail.tabs.holders}
        </button>
        <button
          role="tab"
          onClick={() => setActiveTab('activity')}
          className={`tab tab-lg font-semibold ${activeTab === 'activity' ? 'tab-active' : ''}`}
        >
          {dict.marketDetail.tabs.activity}
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div>
            {/* Add Comment Input */}
            <div className="mb-6">
              <div className="join w-full">
                <input
                  type="text"
                  placeholder={dict.marketDetail.tabs.addComment}
                  className="input input-bordered join-item flex-1"
                />
                <button className="btn btn-primary join-item">{dict.marketDetail.tabs.post}</button>
              </div>
            </div>

            {/* Warning Banner */}
            <div role="alert" className="alert alert-warning mb-6">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="font-medium">{dict.marketDetail.tabs.bewareExternalLinks}</span>
            </div>

            {/* Sort and Filter */}
            <div className="flex items-center gap-4 mb-6">
              <div className="dropdown">
                <button tabIndex={0} className="btn btn-sm btn-ghost gap-2">
                  {sortBy}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  checked={showHoldersOnly}
                  onChange={(e) => setShowHoldersOnly(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="label-text font-medium">{dict.marketDetail.tabs.holdersFilter}</span>
              </label>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="avatar">
                    <div className="w-12 rounded-full">
                      <img src={comment.avatar} alt={comment.username} />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-base text-base-content">{comment.username}</span>
                      {comment.badge && (
                        <span className="badge badge-error badge-sm font-semibold">
                          {comment.badge.text}
                        </span>
                      )}
                      <span className="text-base text-base-content/70">{comment.timestamp}</span>
                    </div>

                    <p className="text-base text-base-content mb-3">{comment.content}</p>

                    <button className="btn btn-ghost btn-xs gap-1.5">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-sm">{comment.likes}</span>
                    </button>
                  </div>

                  <div className="dropdown dropdown-end">
                    <button tabIndex={0} className="btn btn-ghost btn-circle btn-xs">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="1" fill="currentColor"/>
                        <circle cx="12" cy="5" r="1" fill="currentColor"/>
                        <circle cx="12" cy="19" r="1" fill="currentColor"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Holders Tab */}
        {activeTab === 'holders' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Yes Holders */}
            <div>
              <h3 className="text-2xl font-bold text-base-content mb-6">{dict.marketDetail.tabs.yesHolders}</h3>
              <div className="space-y-4">
                {yesHolders.map((holder) => (
                  <div key={holder.rank} className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-12 rounded-full">
                        <img src={holder.avatar} alt={holder.username} />
                      </div>
                      <div className="badge badge-warning badge-sm font-bold absolute -top-1 -right-1">
                        {holder.rank}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base text-base-content">{holder.username}</div>
                      <div className="text-sm font-medium text-success">{holder.shares}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* No Holders */}
            <div>
              <h3 className="text-2xl font-bold text-base-content mb-6">{dict.marketDetail.tabs.noHolders}</h3>
              <div className="space-y-4">
                {noHolders.map((holder) => (
                  <div key={holder.rank} className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-12 rounded-full">
                        <img src={holder.avatar} alt={holder.username} />
                      </div>
                      <div className="badge badge-warning badge-sm font-bold absolute -top-1 -right-1">
                        {holder.rank}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base text-base-content">{holder.username}</div>
                      <div className="text-sm font-medium text-error">{holder.shares}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div>
            {/* Filter */}
            <div className="mb-6">
              <div className="dropdown">
                <button tabIndex={0} className="btn btn-sm btn-ghost gap-2">
                  {dict.marketDetail.tabs.minAmount}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Activity List */}
            <div className="space-y-4">
              {activityItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-base-300">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="avatar">
                      <div className="w-12 rounded-full">
                        <img src={item.avatar} alt={item.username} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-base-content">{item.username}</span>
                      <span className="text-base text-base-content">{item.action === 'bought' ? dict.marketDetail.tabs.bought : dict.marketDetail.tabs.sold}</span>
                      <span className={`font-bold text-base ${item.outcome === 'Yes' ? 'text-success' : 'text-error'}`}>
                        {item.amount} {item.outcome}
                      </span>
                      <span className="text-base text-base-content">{dict.marketDetail.tabs.at}</span>
                      <span className="text-base text-base-content">{item.price}</span>
                      <span className="text-base text-base-content/70">({item.total})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-base-content/70">
                    <span className="text-sm">{item.timestamp}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="15 3 21 3 21 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="10" y1="14" x2="21" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
