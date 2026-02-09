import { formatCurrency, formatShares } from "@/utils/formatting";
import { calculateTotalCost } from "@/utils/order";

interface OrderSummaryProps {
  size: number;
  price: number;
  totalLabel?: string;
  youllGetLabel?: string;
}

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-base-content/60">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default function OrderSummary({
  size,
  price,
  totalLabel = "Total",
  youllGetLabel = "You'll get",
}: OrderSummaryProps) {
  if (size <= 0) return null;

  const totalCost = calculateTotalCost(size, price);

  return (
    <div className="space-y-3 mb-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-base-content">{totalLabel}</span>
        <span className="text-base font-bold text-primary">
          {formatCurrency(totalCost)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-base-content">{youllGetLabel}</span>
          <InfoIcon />
        </div>
        <span className="text-base font-bold text-success">
          {formatShares(size)} shares
        </span>
      </div>
    </div>
  );
}
