import type { PolymarketMarket } from "@/hooks/useMarkets";
import { useDictionary } from "@/providers/dictionary-provider";
import { formatVolume } from "@/utils/formatting";

interface PreviewMarketCardProps {
  market: PolymarketMarket;
}

export default function PreviewMarketCard({ market }: PreviewMarketCardProps) {
  const { dict } = useDictionary();
  const volumeUSD = parseFloat(
    String(market.volume24hr || market.volume || "0")
  );

  const outcomes = market.outcomes ? JSON.parse(market.outcomes) : [];

  const displayOutcomes = outcomes.slice(0, 2);

  return (
    <div className="card card-border bg-base-100 transition-all cursor-pointer group">
      <div className="card-body p-4">
        {/* Top section: Image + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {market.icon && (
              <img
                src={market.icon}
                alt={market.question}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            )}
            <div
              className="tooltip tooltip-bottom market-card-tooltip w-full min-w-0 flex-1"
              data-tip={market.question}
            >
              <h2 className="card-title text-base leading-tight group-hover:text-primary transition-colors line-clamp-2 text-left">
                {market.question}
              </h2>
            </div>
          </div>
        </div>

        {/* Middle section: Outcome badges (Yes/No style) - no prices, colors visible */}
        {displayOutcomes.length > 0 && (
          <div className="card-actions grid grid-cols-2 gap-2 mb-3">
            {displayOutcomes.map((outcome: string, idx: number) => {
              const isSuccess = idx === 0; // First outcome is "success" (Yes), second is "error" (No)
              const o = outcome.toLowerCase();
              const isYesNo = o === "yes" || o === "no";
              const displayLabel = isYesNo
                ? (o === "yes" ? (dict.marketDetail?.tradingModal?.yes ?? "Sí") : (dict.marketDetail?.tradingModal?.no ?? "No"))
                : outcome;

              return (
                <div
                  key={`outcome-badge-${idx}`}
                  className={`badge badge-soft ${isSuccess ? "badge-success" : "badge-error"} badge-lg justify-center py-4 font-bold text-sm w-full cursor-not-allowed overflow-hidden`}
                >
                  <span className="truncate">{displayLabel}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom section: Volume only (no bookmark) */}
        <div className="flex items-center text-xs text-base-content/60">
          <span>{formatVolume(volumeUSD)} {dict.market.volume}</span>
        </div>
      </div>
    </div>
  );
}
