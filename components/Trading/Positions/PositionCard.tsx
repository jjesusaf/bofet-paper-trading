import type { PolymarketPosition } from "@/hooks/useUserPositions";
import { useDictionary } from "@/providers/dictionary-provider";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  formatCurrency,
  formatShares,
  formatPercentage,
} from "@/utils/formatting";

interface PositionCardProps {
  position: PolymarketPosition;
  onSell: (position: PolymarketPosition) => void;
  onRedeem: (position: PolymarketPosition) => void;
  isSelling: boolean;
  isRedeeming: boolean;
  isPendingVerification: boolean;
  isSubmitting: boolean;
  canSell: boolean;
  canRedeem: boolean;
}

export default function PositionCard({
  position,
  onSell,
  onRedeem,
  isSelling,
  isRedeeming,
  isPendingVerification,
  isSubmitting,
  canSell,
  canRedeem,
}: PositionCardProps) {
  const { dict, locale } = useDictionary();
  const router = useRouter();
  const isProfitable = position.cashPnl >= 0;

  const handleViewMarket = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/${locale}/market/${position.slug}`);
  };

  return (
    <div className="card bg-base-100 border border-base-300 transition-all duration-200 hover:shadow-md">
      <div className="card-body p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="card-title text-base md:text-lg line-clamp-2 flex-1">
                {position.title}
              </h3>
              <button
                onClick={handleViewMarket}
                className="btn btn-ghost btn-xs gap-1 shrink-0"
                title="View Market"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="badge badge-outline badge-sm gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {position.outcome}
              </div>
              {position.redeemable && (
                <div className="badge badge-secondary badge-sm">
                  {dict.trading?.positions?.redeemable ?? "Redeemable"}
                </div>
              )}
            </div>
          </div>
          {position.icon && (
            <div className="avatar">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg">
                <img src={position.icon} alt="" />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="stats stats-vertical lg:stats-horizontal bg-base-200 mb-4">
          <div className="stat p-3 md:p-4">
            <div className="stat-title text-xs">{dict.trading?.positions?.size ?? "Size"}</div>
            <div className="stat-value text-lg md:text-2xl">
              {formatShares(position.size)}
            </div>
            <div className="stat-desc text-xs">{dict.trading?.positions?.shares ?? "shares"}</div>
          </div>

          <div className="stat p-3 md:p-4">
            <div className="stat-title text-xs">{dict.trading?.positions?.avgPrice ?? "Avg Price"}</div>
            <div className="stat-value text-lg md:text-2xl">{formatCurrency(position.avgPrice, 3)}</div>
            <div className="stat-desc text-xs">{dict.trading?.positions?.currentPrice ?? "Current"}: {formatCurrency(position.curPrice, 3)}</div>
          </div>

          <div className="stat p-3 md:p-4">
            <div className="stat-title text-xs">{dict.trading?.positions?.pnl ?? "P&L"}</div>
            <div className={`stat-value text-lg md:text-2xl ${isProfitable ? 'text-success' : 'text-error'}`}>
              {formatCurrency(position.cashPnl)}
            </div>
            <div className={`stat-desc text-xs font-semibold ${isProfitable ? 'text-success' : 'text-error'}`}>
              {formatPercentage(position.percentPnl)}
            </div>
          </div>
        </div>

        {/* Value Information */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/60 mb-1">
              {dict.trading?.positions?.currentValue ?? "Current Value"}
            </div>
            <div className="text-base font-bold">
              {formatCurrency(position.currentValue)}
            </div>
          </div>
          <div className="bg-base-200 rounded-lg p-3">
            <div className="text-xs text-base-content/60 mb-1">
              {dict.trading?.positions?.initialValue ?? "Initial Value"}
            </div>
            <div className="text-base font-bold">
              {formatCurrency(position.initialValue)}
            </div>
          </div>
        </div>

        {/* Redeemable Alert */}
        {position.redeemable && (
          <div className="alert alert-info mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">
              {dict.trading?.positions?.eventCompleted ?? "Event Completed - Position Redeemable"}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          {position.redeemable ? (
            <div className="w-full space-y-2">
              <button
                onClick={() => onRedeem(position)}
                disabled={isRedeeming || !canRedeem}
                className="btn btn-secondary btn-block"
              >
                {isRedeeming ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {dict.trading?.positions?.redeeming ?? "Redeeming..."}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {dict.trading?.positions?.redeemPosition ?? "Redeem Position"}
                  </>
                )}
              </button>
              {!canRedeem && (
                <div className="alert alert-warning py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-xs">
                    {dict.trading?.positions?.initializeFirst ?? "Initialize trading session first"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full space-y-2">
              <button
                onClick={() => onSell(position)}
                disabled={isSelling || isSubmitting || !canSell || isPendingVerification}
                className="btn btn-soft btn-error btn-block"
              >
                {(isSelling || isPendingVerification) ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {dict.trading?.positions?.processing ?? "Processing..."}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    {dict.trading?.positions?.marketSell ?? "Market Sell"}
                  </>
                )}
              </button>
              {!canSell && (
                <div className="alert alert-warning py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-xs">
                    {dict.trading?.orderModal?.initializeClobFirst ?? "Initialize CLOB client first"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
