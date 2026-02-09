import { isValidDecimalInput } from "@/utils/validation";

interface OrderFormProps {
  size: string;
  onSizeChange: (value: string) => void;
  limitPrice: string;
  onLimitPriceChange: (value: string) => void;
  orderType: "market" | "limit";
  currentPrice: number;
  isSubmitting: boolean;
  tickSize: number;
  decimalPlaces: number;
  isLoadingTickSize: boolean;
  sharesLabel?: string;
  limitPriceLabel?: string;
}

const isValidPriceInput = (value: string, maxDecimals: number): boolean => {
  if (value === "" || value === "0" || value === "0.") return true;
  const regex = new RegExp(`^(0?\\.[0-9]{0,${maxDecimals}}|0)$`);
  return regex.test(value);
};

export default function OrderForm({
  size,
  onSizeChange,
  limitPrice,
  onLimitPriceChange,
  orderType,
  currentPrice,
  isSubmitting,
  tickSize,
  decimalPlaces,
  isLoadingTickSize,
  sharesLabel = "Shares",
  limitPriceLabel = "Limit Price",
}: OrderFormProps) {
  const handleSizeChange = (value: string) => {
    if (isValidDecimalInput(value)) {
      onSizeChange(value);
    }
  };

  const handleLimitPriceChange = (value: string) => {
    if (isValidPriceInput(value, decimalPlaces)) {
      onLimitPriceChange(value);
    }
  };

  const priceInCents = Math.round(currentPrice * 100);
  // Ensure tickSize is a valid number before calling toFixed
  const safeTickSize =
    typeof tickSize === "number" && !isNaN(tickSize) ? tickSize : 0.01;
  const tickSizeDisplay = safeTickSize.toFixed(decimalPlaces);
  const maxPriceDisplay = (1 - safeTickSize).toFixed(decimalPlaces);

  return (
    <>
      {/* Current Price */}
      <div className="mb-4 bg-base-200 rounded-lg p-3 border border-base-300">
        <p className="text-sm font-bold text-base-content mb-1">Current Market Price</p>
        <p className="text-base font-bold text-primary">{priceInCents}¢</p>
      </div>

      {/* Size Input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 mb-2">
          {sharesLabel}
        </label>
        <input
          type="text"
          value={size}
          onChange={(e) => handleSizeChange(e.target.value)}
          placeholder="0"
          className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base-content"
          disabled={isSubmitting}
        />
      </div>

      {/* Limit Price Input */}
      {orderType === "limit" && (
        <div className="mb-4">
          <label className="block text-sm font-bold text-base-content mb-2">
            {limitPriceLabel}
            {isLoadingTickSize && (
              <span className="ml-2 text-xs text-blue-600">
                Loading tick size...
              </span>
            )}
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={limitPrice}
            onChange={(e) => handleLimitPriceChange(e.target.value)}
            placeholder={tickSizeDisplay}
            className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base-content"
            disabled={isSubmitting || isLoadingTickSize}
          />
          <p className="text-xs text-gray-600 mt-1">
            Tick size: ${tickSizeDisplay} • Range: ${tickSizeDisplay} - $
            {maxPriceDisplay}
          </p>
        </div>
      )}
    </>
  );
}
