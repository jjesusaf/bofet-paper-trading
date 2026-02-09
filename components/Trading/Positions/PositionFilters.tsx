import { useDictionary } from "@/providers/dictionary-provider";

interface PositionFiltersProps {
  positionCount: number;
  hideDust: boolean;
  onToggleHideDust: () => void;
}

export default function PositionFilters({
  positionCount,
  hideDust,
  onToggleHideDust,
}: PositionFiltersProps) {
  const { dict } = useDictionary();
  return (
    <div className="card bg-base-100 border border-base-300 mb-6">
      <div className="card-body p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Title with Count Badge */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold">
              {dict.trading?.positions?.title ?? "Positions"}
            </h2>
            <div className="badge badge-primary badge-lg font-bold">
              {positionCount}
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-3">
            <label className="label cursor-pointer gap-2">
              <span className="label-text font-medium text-sm md:text-base">
                {dict.trading?.positions?.hideDust ?? "Hide Dust"}
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={hideDust}
                onChange={onToggleHideDust}
              />
            </label>
          </div>
        </div>

        {/* Optional: Info text */}
        <div className="text-sm text-base-content/60 mt-2">
          {hideDust
            ? dict.trading?.positions?.hidingDustPositions ?? "Hiding positions with value < $0.01"
            : dict.trading?.positions?.showingAll ?? "Showing all positions"}
        </div>
      </div>
    </div>
  );
}
