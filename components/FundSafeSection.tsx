"use client";

import { useState } from "react";
import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";
import { useDictionary } from "@/providers/dictionary-provider";
import usePolygonBalances from "@/hooks/usePolygonBalances";
import useEoaBridgeConvert, {
  type EoaConvertStatus,
} from "@/hooks/useEoaBridgeConvert";
import useEoaToSafeTransfer from "@/hooks/useEoaToSafeTransfer";
import { parseUsdcAmount } from "@/utils/bridge";
import { MIN_BRIDGE_DEPOSIT } from "@/constants/api";
import { Loader2, ArrowRightCircle, Send } from "lucide-react";

const CONVERT_STATUS_KEYS: Record<EoaConvertStatus, string> = {
  idle: "",
  "fetching-address": "convertStatusFetching",
  "sending-usdc": "convertStatusSending",
  "waiting-bridge": "convertStatusWaiting",
  "waiting-bridge-extended": "convertStatusExtended",
  completed: "convertComplete",
  failed: "",
};

function getConvertStatusLabel(
  status: EoaConvertStatus,
  isExtendedWait: boolean,
  dict: { fundSafe?: Record<string, string> }
): string {
  if (isExtendedWait)
    return dict.fundSafe?.convertStatusExtended ?? "Taking longer than usual — your funds are safe.";
  const key = CONVERT_STATUS_KEYS[status];
  if (!key) return dict.fundSafe?.convertFallback ?? "Converting…";
  return dict.fundSafe?.[key] ?? "Converting…";
}

export default function FundSafeSection() {
  const { dict } = useDictionary();
  const { eoaAddress } = useWallet();
  const { safeAddress } = useTrading();
  const eoaBalances = usePolygonBalances(eoaAddress ?? undefined);
  const safeBalances = usePolygonBalances(safeAddress ?? undefined);

  const [convertAmount, setConvertAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const {
    convertUsdcToUsdce,
    isConverting,
    status: convertStatus,
    error: convertError,
    isExtendedWait,
  } = useEoaBridgeConvert();

  const {
    transferUsdceToSafe,
    isTransferring,
    error: transferError,
  } = useEoaToSafeTransfer();

  const convertAmountNum = parseFloat(convertAmount) || 0;
  const transferAmountNum = parseFloat(transferAmount) || 0;
  const canConvert =
    convertAmountNum >= MIN_BRIDGE_DEPOSIT &&
    convertAmountNum <= eoaBalances.nativeUsdcBalance &&
    !isConverting;
  const canTransfer =
    transferAmountNum > 0 &&
    transferAmountNum <= eoaBalances.usdcBalance &&
    !isTransferring &&
    !!safeAddress;

  const handleConvert = async () => {
    if (!canConvert) return;
    try {
      const amountBigInt = parseUsdcAmount(convertAmountNum);
      await convertUsdcToUsdce(amountBigInt);
      setConvertAmount("");
    } catch {
      // Error shown via convertError
    }
  };

  const handleTransfer = async () => {
    if (!canTransfer) return;
    try {
      const amountBigInt = parseUsdcAmount(transferAmountNum);
      await transferUsdceToSafe(amountBigInt);
      setTransferAmount("");
    } catch {
      // Error shown via transferError
    }
  };

  if (!eoaAddress) return null;

  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-200 mb-8">
      <h2 className="text-lg font-bold text-slate-900 mb-2">
        {dict.fundSafe?.title ?? "Fund your Safe with USDC.e"}
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        {dict.fundSafe?.description ??
          "Convert native USDC to USDC.e at your wallet, then transfer to your Safe. Total time is typically ~2 minutes when both steps run."}
      </p>

      {/* Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
            {dict.fundSafe?.eoaLabel ?? "Your wallet (EOA)"}
          </p>
          <p className="text-slate-900 font-medium">
            {dict.fundSafe?.nativeUsdc ?? "Native USDC:"} ${eoaBalances.formattedNativeUsdcBalance}
          </p>
          <p className="text-slate-900 font-medium">
            {dict.fundSafe?.usdce ?? "USDC.e:"} ${eoaBalances.formattedUsdcBalance}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
            {dict.fundSafe?.safeLabel ?? "Safe"}
          </p>
          <p className="text-slate-900 font-medium">
            {dict.fundSafe?.usdce ?? "USDC.e:"} $
            {safeAddress
              ? safeBalances.formattedUsdcBalance
              : (dict.fundSafe?.safeBalanceUnavailable ?? "—")}
          </p>
          {!safeAddress && (
            <p className="text-xs text-amber-600 mt-1">
              {dict.fundSafe?.startSessionToSeeBalance ??
                "Start a trading session to see Safe balance"}
            </p>
          )}
        </div>
      </div>

      {/* Step A: Convert USDC → USDC.e */}
      <div className="mb-6 pb-6 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">
          {dict.fundSafe?.step1Title ?? "Step 1 — Convert USDC → USDC.e"}
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {dict.fundSafe?.step1Helper ??
            `Minimum $${MIN_BRIDGE_DEPOSIT} USD. Usually takes about 1 minute.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={dict.fundSafe?.amountPlaceholder ?? "Amount (USD)"}
            value={convertAmount}
            onChange={(e) => setConvertAmount(e.target.value)}
            disabled={isConverting}
            className="input input-bordered w-full sm:max-w-[180px]"
          />
          <button
            type="button"
            onClick={handleConvert}
            disabled={!canConvert}
            className="btn bg-[#00C805] hover:bg-[#00A804] text-white border-0 gap-2"
          >
            {isConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {getConvertStatusLabel(convertStatus, isExtendedWait, dict)}
              </>
            ) : (
              <>
                <ArrowRightCircle className="w-4 h-4" />
                {dict.fundSafe?.convertButton ?? "Convert USDC → USDC.e"}
              </>
            )}
          </button>
        </div>
        {convertStatus === "completed" && (
          <p className="text-sm text-green-600 mt-2">
            {dict.fundSafe?.convertComplete ?? "Conversion complete."}
          </p>
        )}
        {convertError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{convertError.message}</p>
          </div>
        )}
      </div>

      {/* Step B: Transfer USDC.e to Safe */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">
          {dict.fundSafe?.step2Title ?? "Step 2 — Transfer USDC.e to Safe"}
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {dict.fundSafe?.step2Helper ??
            "Sending USDC.e to your Safe. Usually takes about 1 minute."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder={dict.fundSafe?.amountPlaceholder ?? "Amount (USD)"}
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            disabled={isTransferring || !safeAddress}
            className="input input-bordered w-full sm:max-w-[180px]"
          />
          <button
            type="button"
            onClick={handleTransfer}
            disabled={!canTransfer}
            className="btn bg-[#00C805] hover:bg-[#00A804] text-white border-0 gap-2"
          >
            {isTransferring ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {dict.fundSafe?.transferStatus ?? "Transferring… (~1 min)"}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {dict.fundSafe?.transferButton ?? "Transfer USDC.e to Safe"}
              </>
            )}
          </button>
        </div>
        {transferError && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{transferError.message}</p>
          </div>
        )}
        {!safeAddress && (
          <p className="text-xs text-amber-600 mt-2">
            {dict.fundSafe?.startSessionToTransfer ??
              "Start a trading session to enable transfer to Safe."}
          </p>
        )}
      </div>
    </div>
  );
}
