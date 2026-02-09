'use client'

import { useState } from 'react'
import { useDictionary } from '@/providers/dictionary-provider'
import TradingModal from './TradingModal'

interface TradingButtonsProps {
  yesPrice?: string
  noPrice?: string
  yesPriceNum?: number
  noPriceNum?: number
  marketTitle?: string
  marketImage?: string
  yesTokenId?: string
  noTokenId?: string
  negRisk?: boolean
  onBuyYes?: () => void
  onBuyNo?: () => void
  
}

export default function TradingButtons({
  yesPrice,
  noPrice,
  yesPriceNum,
  noPriceNum,
  marketTitle,
  marketImage,
  yesTokenId,
  noTokenId,
  negRisk,
  onBuyYes,
  onBuyNo,

}: TradingButtonsProps) {
  const { dict } = useDictionary()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState<'yes' | 'no'>('yes')

  const handleBuyYes = () => {
    if (onBuyYes) {
      onBuyYes()
    } else {
      setSelectedOutcome('yes')
      setIsModalOpen(true)
    }
  }

  const handleBuyNo = () => {
    if (onBuyNo) {
      onBuyNo()
    } else {
      setSelectedOutcome('no')
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <div className="w-full bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            {/* Buy Yes Button */}
            <div
              onClick={handleBuyYes}
              className="badge badge-soft badge-success badge-lg justify-center py-6 font-bold text-base w-full cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>{dict.marketDetail.tradingButtons.yes}</span>
                <span>{yesPrice}</span>
              </div>
            </div>

            {/* Buy No Button */}
            <div
              onClick={handleBuyNo}
              className="badge badge-soft badge-error badge-lg justify-center py-6 font-bold text-base w-full cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>{dict.marketDetail.tradingButtons.no}</span>
                <span>{noPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Modal - acts as bottom sheet on mobile */}
      <TradingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        marketTitle={marketTitle}
        marketImage={marketImage}
        yesPrice={yesPriceNum}
        noPrice={noPriceNum}
        yesTokenId={yesTokenId}
        noTokenId={noTokenId}
        negRisk={negRisk}
        selectedOutcome={selectedOutcome}
        externalOrderType="market"
     
      />
    </>
  )
}
