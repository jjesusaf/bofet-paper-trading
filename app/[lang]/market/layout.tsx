'use client'

import { useWallet } from '@/providers/WalletContext'
import { useTrading } from '@/providers/TradingProvider'
import Navbar from '@/components/Navbar'
import NavbarPreview from '@/components/Navbar/NavbarPreview'

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { eoaAddress } = useWallet()
  const { isTradingSessionComplete } = useTrading()

  // Show preview navbar if not logged in or session not complete
  const showPreviewNavbar = !eoaAddress || !isTradingSessionComplete

  return (
    <>
      {showPreviewNavbar ? <NavbarPreview /> : <Navbar />}
      {children}
    </>
  )
}
