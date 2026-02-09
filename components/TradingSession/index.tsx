"use client";

import { useWallet } from "@/providers/WalletContext";
import { useDictionary } from "@/providers/dictionary-provider";

import SessionInfo from "@/components/TradingSession/SessionInfo";
import SessionStatus from "@/components/TradingSession/SessionStatus";
import SessionSuccess from "@/components/TradingSession/SessionSuccess";
import SessionProgress from "@/components/TradingSession/SessionProgress";

import type {
  TradingSession as TradingSessionType,
  SessionStep,
} from "@/utils/session";

interface Props {
  session: TradingSessionType | null;
  currentStep: SessionStep;
  error: Error | null;
  isComplete: boolean | undefined;
  initialize: () => Promise<void>;
  endSession: () => void;
}

export default function TradingSession({
  session,
  currentStep,
  error,
  isComplete,
  initialize,
  endSession,
}: Props) {
  const { eoaAddress } = useWallet();
  const { dict } = useDictionary();

  if (!eoaAddress) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-[28px] border border-slate-200">
      <SessionStatus isComplete={isComplete} />
      <SessionInfo isComplete={isComplete} />
      <SessionProgress currentStep={currentStep} />
      {isComplete && session && <SessionSuccess session={session} />}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 mb-4">
          <p className="text-sm text-red-600 font-medium mb-2">{dict.common?.error ?? "Error"}</p>
          <pre className="text-xs text-red-500 whitespace-pre-wrap">
            {error.message}
          </pre>
        </div>
      )}
    </div>
  );
}
