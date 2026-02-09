'use client'

import { useWallet } from '@/providers/WalletContext'
import { useTrading } from '@/providers/TradingProvider'
import MarketDetailContent from '@/components/Market'
import MarketDetailPreview from '@/components/Market/PreviewMarketPage'

interface MarketPageContentProps {
  marketSlug: string
}

export default function MarketPageContent({ marketSlug }: MarketPageContentProps) {
  const { eoaAddress } = useWallet()
  const { isTradingSessionComplete } = useTrading()

  // Show preview if not logged in or session not complete
  const showPreview = !eoaAddress || !isTradingSessionComplete

  if (showPreview) {
    return <MarketDetailPreview marketSlug={marketSlug} />
  }

  return <MarketDetailContent marketSlug={marketSlug} />
}
