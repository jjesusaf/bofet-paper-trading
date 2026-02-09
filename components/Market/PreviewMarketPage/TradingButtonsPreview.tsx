'use client'

import { useWallet } from '@/providers/WalletContext'
import { useDictionary } from '@/providers/dictionary-provider'

export default function TradingButtonsPreview() {
  const { dict } = useDictionary()
  const { connect } = useWallet()

  const handleClick = async () => {
    await connect()
  }

  return (
    <div className="w-full bg-base-100 border-b border-base-300">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          {/* Buy Yes Button - Triggers connect */}
          <div
            onClick={handleClick}
            className="badge badge-soft badge-success badge-lg justify-center py-6 font-bold text-base w-full cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <span>{dict.marketDetail.tradingButtons.yes}</span>
              {/* No price shown in preview */}
            </div>
          </div>

          {/* Buy No Button - Triggers connect */}
          <div
            onClick={handleClick}
            className="badge badge-soft badge-error badge-lg justify-center py-6 font-bold text-base w-full cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <span>{dict.marketDetail.tradingButtons.no}</span>
              {/* No price shown in preview */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
