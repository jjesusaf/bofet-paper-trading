'use client'

import { createContext, useContext, ReactNode } from 'react'

// Type for the dictionary - will be inferred from the JSON
type Dictionary = {
  navbar: {
    markets: string
    investingHome: string
    portfolio: string
    deposit: string
    cashOut: string
    payment?: string
    payout?: string
    claiming: string
    searchPlaceholder: string
    restartTour: string
    howItWorks: string
    viewProfile: string
    more: string
    sendUsdc?: string
    swapToUsdc?: string
    swapToUsdcSending?: string
    swapToUsdcTooltip?: string
    swapToUsdcErrorNoBalance?: string
  }
  login: {
    loading: string
    connect: string
  }
  onboarding: {
    welcome: {
      title: string
      subtitle?: string
      progressLabel?: string
      description?: string
      step?: string
      start?: string
    }
    source: {
      title: string
      description: string
      next?: string
      step?: string
      back?: string
      continue?: string
      options: {
        search_engine?: string
        friend_referral?: string
        social_media?: string
        crypto_community?: string
        twitter?: string
        youtube?: string
        other?: string
        social_media_legacy?: { label: string; description: string }
        search_engine_legacy?: { label: string; description: string }
        friend_referral_legacy?: { label: string; description: string }
        crypto_community_legacy?: { label: string; description: string }
        other_legacy?: { label: string; description: string }
      }
    }
    experience?: {
      title: string
      description: string
      back: string
      complete: string
      saving: string
      options: {
        beginner: { label: string; description: string }
        intermediate: { label: string; description: string }
        advanced: { label: string; description: string }
        professional: { label: string; description: string }
      }
    }
    video?: {
      title: string
      description: string
      continue: string
    }
    investor: {
      title: string
      description: string
      step: string
      back: string
      continue: string
      options: {
        beginner: { label: string; description: string }
        intermediate: { label: string; description: string }
        advanced: { label: string; description: string }
        professional: { label: string; description: string }
      }
    }
  }
  tour: {
    welcome: { title: string; description: string }
    claimTokens: { title: string; description: string }
    marketCard: { title: string; description: string }
    marketBuy: { title: string; description: string }
    progress: string
    next: string
    done: string
  }
  toast: {
    tokensClaimed: { title: string; description: string }
    claimFailed: { title: string; description: string }
  }
  exploreMarkets: {
    categories: {
      all: string
      trending?: string
      politics: string
      crypto: string
      sports: string
      finance: string
      tech?: string
      culture?: string
      geopolitics: string
      science: string
    }
  }
  marketAnalysis: {
    backToMarkets: string
    loadingMarketData: string
    marketNotFound: string
    verifiedPrediction: string
    volume: string
    totalShares: string
    optionAShares: string
    endDate: string
    aboutThisMarket: string
    optionA: string
    optionB: string
    trade: string
  }
  portfolio: {
    totalInvesting: string
    today: string
    buyingPower: string
    deposit: string
    positions: string
    market: string
    price: string
    return: string
    shares: string
    avg: string
  }
  market: {
    volume: string
    buy: {
      errors: {
        amountGreaterThanZero: string
        connectWallet: string
        checkApproval: string
        approveTokens: string
        selectOptionAndAmount: string
      }
      approval: {
        title: string
        description: string
        approving: string
        setApproval: string
      }
      confirm: {
        title: string
        description: string
        shares: string
        confirming: string
        button: string
      }
      input: {
        placeholder: string
        priceLabel: string
      }
      cancel: string
      success: {
        title: string
        description: string
      }
      failed: {
        title: string
        description: string
      }
    }
    resolved: {
      label: string
      claimRewards: string
      success: {
        title: string
        description: string
      }
      failed: {
        title: string
        description: string
      }
    }
    shares: {
      title: string
      label: string
    }
  }
  wallet: {
    connect: string
    disconnect: string
    initializing: string
    initializeSession: string
    initializingSession: string
    clickHere: string
    initializeGuide: string
    connected: string
    logoAlt: string
    depositComingSoon: string
    pleaseLogin: string
    disconnectConfirmTitle?: string
    disconnectConfirmMessage?: string
    disconnectCancel?: string
    disconnectConfirm?: string
  }
  trading: {
    tabs: {
      positions: string
      orders: string
      markets: string
    }
    session: {
      title: string
      ready: string
      notInitialized: string
      active: string
      end: string
      notStarted: string
      checking: string
      deploying: string
      credentials: string
      approvals: string
      checkingSafe: string
      deployingSafe: string
      gettingCredentials: string
      settingApprovals: string
    }
    positions: {
      title: string
      showAll: string
      hideDust: string
      size: string
      avgPrice: string
      currentPrice: string
      currentValue: string
      initialValue: string
      pnl: string
      shares: string
      eventCompleted: string
      redeeming: string
      redeemPosition: string
      initializeFirst: string
      marketSell: string
      processing: string
      relayNotInitialized: string
      redeemFailed: string
      loading: string
      errorLoading: string
      noPositions: string
      noPositionsMessage: string
      authRequired: string
      pleaseSignIn: string
      myPositions: string
      subtitle: string
      dustPositionsHidden: string
      dustThreshold: string
      redeemable: string
      hidingDustPositions?: string
      showingAll?: string
    }
    orders: {
      market: string
      loading: string
      price: string
      shares: string
      total: string
      id: string
      cancelling: string
      cancelOrder: string
      errorLoading: string
      noOrders: string
      noOrdersMessage: string
    }
    markets: {
      sortedBy: string
      loadingMarkets: string
      errorLoading: string
      noMarkets: string
      noMarketsMessage: string
    }
    orderModal: {
      limitPriceRequired: string
      priceBetween: string
      priceMultiple: string
      placingOrder: string
      placeOrder: string
      initializeClobFirst: string
      availableForOrders?: string
      insufficientBalanceSafe?: string
      fundSafeToPlaceOrders?: string
      fundSafeViaDeposit?: string
      fundingSafe?: string
      convertingUsdc?: string
      transferringToSafe?: string
      step1Of2?: string
      step2Of2?: string
    }
  }
  transfer: {
    title: string
    success: string
    availableBalance: string
    recipientAddress: string
    recipientPlaceholder: string
    amount: string
    amountPlaceholder: string
    max: string
    sending: string
    send: string
    startSessionFirst: string
  }
  deposit: {
    redirecting: string
    infoNote: string
  }
  payment?: {
    title?: string
    currency?: string
    amount?: string
    method?: string
    amountPlaceholder?: string
    amountMinHint?: string
    submit?: string
    amountInvalid?: string
    amountBelowMin?: string
    methodRequired?: string
    equivalentUsd?: string
    estimateReceive?: string
    amountBelowMinUsd?: string
    methods?: { applePay?: string; swift?: string; spei?: string }
  }
  payout?: {
    title?: string
    takeMoneyOut?: string
    amountUsd?: string
    amountUsdPlaceholder?: string
    currencyPreference?: string
    method?: string
    noticeExchangeRate?: string
    submit?: string
    amountInvalid?: string
    amountBelowMin?: string
    methodRequired?: string
    methods?: { applePay?: string; swift?: string; spei?: string }
  }
  profile: {
    title: string
    connectToView: string
    accountVerified: string
    safe: string
    connected: string
    sendFunds: string
    sendUsdc: string
    walletInformation: string
    personalInformation: string
    personalInformationDesc: string
    security: string
    securityDesc: string
    statements: string
    statementsDesc: string
    accountSettings: string
    eoa: string
    copyEoa: string
    copySafe: string
    deployed: string
    credentials: string
    approvals: string
    predictionsWon: string
    totalRoi: string
  }
  fundSafe: {
    title: string
    description: string
    eoaLabel: string
    safeLabel: string
    nativeUsdc: string
    usdce: string
    safeBalanceUnavailable: string
    startSessionToSeeBalance: string
    step1Title: string
    step1Helper: string
    amountPlaceholder: string
    convertButton: string
    convertStatusFetching: string
    convertStatusSending: string
    convertStatusWaiting: string
    convertStatusExtended: string
    convertComplete: string
    convertFallback: string
    step2Title: string
    step2Helper: string
    transferButton: string
    transferStatus: string
    startSessionToTransfer: string
  }
  common: {
    yes: string
    no: string
    set: string
    notSet: string
    error: string
    unknownError: string
    goHome: string
  }
  emptyStates: {
    error: string
    noMarkets: string
    noPositions: string
    noOrders: string
  }
  footer: {
    slogan: string
  }
  helpBanner: {
    title: string
    day: string
    days: string
    close: string
    telegramMessagePrefix: string
    telegram: string
  }
  signin?: {
    title: string
    welcomeBack: string
    subtitle: string
    signUpTitle: string
    signUpSubtitle: string
    back: string
    email: string
    emailPlaceholder: string
    continue: string
    loading: string
    or: string
    noAccount: string
    signUp: string
    termsPrefix: string
    termsOfService: string
    and: string
    privacyPolicy: string
    invalidEmail: string
    error: string
  }
  reportBug?: {
    title: string
    intro: string
    jamChrome: string
    jamLink: string
    thanks: string
    emailLabel: string
    emailPlaceholder: string
    messageLabel: string
    messagePlaceholder: string
    jamUrlLabel: string
    jamUrlPlaceholder: string
    submit: string
    submitting: string
    success: string
  }
  howItWorksModal: {
    step1: {
      title: string
      description: string
    }
    step2: {
      title: string
      description: string
    }
    step3: {
      title: string
      description: string
    }
    next: string
    getStarted: string
    watchOnboardingVideo: string
  },
  marketDetail: {
    header: {
      goBack: string
      volume: string
      bookmark: string
      share: string
    }
    chart: {
      settings: string
    }
    orderBook: {
      title: string
      toggleOrderBook: string
      tradeYes: string
      tradeNo: string
      price: string
      shares: string
      total: string
      asks: string
      bids: string
      last: string
      spread: string
    }
    rules: {
      title: string
      showLess: string
      showMore: string
      volume: string
      endDate: string
      createdAt: string
      resolver: string
      proposeResolution: string
    }
    tabs: {
      comments: string
      holders: string
      activity: string
      addComment: string
      post: string
      bewareExternalLinks: string
      newest: string
      holdersFilter: string
      yesHolders: string
      noHolders: string
      shares: string
      bought: string
      sold: string
      at: string
      minAmount: string
    }
    tradingButtons: {
      yes: string
      no: string
    }
    bottomSheetTrading: {
      limitPrice: string
      shares: string
      amount: string
      setExpiration: string
      total: string
      toWin: string
      youllReceive: string
      trade: string
      termsMessage: string
      termsLink: string
    }
    tradingModal: {
      buy: string
      sell: string
      limit: string
      market: string
      yes: string
      no: string
      limitPrice: string
      amount: string
      shares: string
      setExpiration: string
      total: string
      toWin: string
      youllGet: string
      youllReceive: string
      trade: string
      quickButtons: {
        minus100: string
        minus10: string
        plus10: string
        plus100: string
        percent25: string
        percent50: string
      }
    }
    openOrders: {
      title: string
      side: string
      size: string
      price: string
      total: string
      buy: string
      sell: string
      cancel: string
      empty: string
    }
  }
}

type DictionaryContextType = {
  dict: Dictionary
  locale: string
}

const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined)

export function DictionaryProvider({
  children,
  dict,
  locale,
}: {
  children: ReactNode
  dict: Dictionary
  locale: string
}) {
  return (
    <DictionaryContext.Provider value={{ dict, locale }}>
      {children}
    </DictionaryContext.Provider>
  )
}

export function useDictionary() {
  const context = useContext(DictionaryContext)
  if (!context) {
    throw new Error('useDictionary must be used within DictionaryProvider')
  }
  return context
}
