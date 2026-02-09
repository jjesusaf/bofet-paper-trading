interface OrderTypeToggleProps {
  orderType: "market" | "limit";
  onChangeOrderType: (type: "market" | "limit") => void;
  marketLabel?: string;
  limitLabel?: string;
}

export default function OrderTypeToggle({
  orderType,
  onChangeOrderType,
  marketLabel = "Market",
  limitLabel = "Limit",
}: OrderTypeToggleProps) {
  return (
    <div className="mb-4">
      <div className="join border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => onChangeOrderType("market")}
          className={`join-item px-6 py-2 font-bold text-sm transition-colors cursor-pointer ${
            orderType === "market"
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          {marketLabel}
        </button>
        <button
          onClick={() => onChangeOrderType("limit")}
          className={`join-item px-6 py-2 font-bold text-sm transition-colors cursor-pointer ${
            orderType === "limit"
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          {limitLabel}
        </button>
      </div>
    </div>
  );
}
