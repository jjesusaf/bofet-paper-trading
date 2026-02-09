// Polymarket API Response Types (Based on official documentation)

// Market object within an Event
export interface PolymarketMarket {
  id: string
  question: string
  conditionId?: string
  slug: string
  description?: string
  endDate?: string
  category?: string
  image?: string
  icon?: string
  active: boolean
  closed: boolean
  archived?: boolean
  volume?: string | number
  volume24hr?: number
  liquidity?: string | number
  liquidityNum?: number
  outcomes?: string
  outcomePrices?: string
  clobTokenIds?: string
  spread?: number
  acceptingOrders?: boolean
  // Add other fields as needed from the API response
}

export interface PolymarketSearchEvent {
  id: string
  ticker?: string
  slug: string
  title: string
  subtitle?: string
  description: string
  resolutionSource?: string
  startDate?: string
  creationDate?: string
  endDate?: string
  image: string
  icon: string
  active: boolean
  closed: boolean
  archived: boolean
  new: boolean
  featured: boolean
  restricted: boolean
  liquidity: number
  volume: number
  volume24hr?: number
  openInterest?: number
  markets?: PolymarketMarket[]
  tags?: PolymarketTag[]
}

export interface PolymarketTag {
  id: string
  label: string
  slug: string
  forceShow?: boolean
  forceHide?: boolean
  isCarousel?: boolean
  publishedAt?: string
  createdBy?: number
  updatedBy?: number
  createdAt?: string
  updatedAt?: string
}

export interface PolymarketSearchTag {
  id: string
  label: string
  slug: string
  event_count: number
}

export interface PolymarketSearchProfile {
  id: string
  name: string
  user?: number
  pseudonym?: string
  displayUsernamePublic?: boolean
  profileImage?: string
  bio?: string
  proxyWallet?: string
  walletActivated?: boolean
}

export interface PolymarketSearchPagination {
  hasMore: boolean
  totalResults: number
}

export interface PolymarketSearchResponse {
  events: PolymarketSearchEvent[]
  tags: PolymarketSearchTag[]
  profiles: PolymarketSearchProfile[]
  pagination: PolymarketSearchPagination
}

// Market Detail Response (from /markets/{slug} endpoint)
export interface PolymarketMarketDetail {
  id: string
  question: string
  conditionId: string
  slug: string
  resolutionSource: string
  endDate: string
  liquidity: string
  startDate: string
  image: string
  icon: string
  description: string
  outcomes: string
  outcomePrices: string
  volume: string
  active: boolean
  closed: boolean
  marketMakerAddress: string
  createdAt: string
  updatedAt: string
  new: boolean
  featured: boolean
  submitted_by: string
  archived: boolean
  resolvedBy: string
  restricted: boolean
  groupItemTitle?: string
  groupItemThreshold?: string
  questionID: string
  enableOrderBook: boolean
  orderPriceMinTickSize: number
  orderMinSize: number
  volumeNum: number
  liquidityNum: number
  endDateIso: string
  startDateIso: string
  hasReviewedDates: boolean
  volume24hr: number
  volume1wk: number
  volume1mo: number
  volume1yr: number
  clobTokenIds: string
  umaBond?: string
  umaReward?: string
  volume24hrClob: number
  volume1wkClob: number
  volume1moClob: number
  volume1yrClob: number
  volumeClob: number
  liquidityClob: number
  customLiveness?: number
  acceptingOrders: boolean
  negRisk: boolean
  negRiskMarketID?: string
  negRiskRequestID?: string
  events?: PolymarketSearchEvent[]
  ready: boolean
  funded: boolean
  acceptingOrdersTimestamp?: string
  cyom: boolean
  competitive: number
  pagerDutyNotificationEnabled: boolean
  approved: boolean
  rewardsMinSize: number
  rewardsMaxSpread: number
  spread: number
  oneWeekPriceChange?: number
  oneMonthPriceChange?: number
  lastTradePrice?: number
  bestBid?: number
  bestAsk?: number
  automaticallyActive: boolean
  clearBookOnStart: boolean
  seriesColor?: string
  showGmpSeries?: boolean
  showGmpOutcome?: boolean
  manualActivation: boolean
  negRiskOther: boolean
  umaResolutionStatuses?: string
  pendingDeployment: boolean
  deploying: boolean
  deployingTimestamp?: string
  rfqEnabled: boolean
  holdingRewardsEnabled: boolean
  feesEnabled: boolean
  requiresTranslation: boolean
  // Add realtime prices (from WebSocket or separate call)
  realtimePrices?: {
    [tokenId: string]: {
      bidPrice: number
      askPrice: number
      midPrice: number
    }
  }
}

// Our internal SearchModal types
export interface SearchResult {
  id: string
  category: 'Market' | 'Tag' | 'Profile'
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

export interface SearchResponse {
  results: SearchResult[]
  totalResults: number
  hasMore: boolean
}
