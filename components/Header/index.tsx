"use client";

import { useWallet } from "@/providers/WalletContext";
import { useTrading } from "@/providers/TradingProvider";

export default function Header() {
  const { eoaAddress, connect, disconnect } = useWallet();
  const {
    isTradingSessionComplete,
    initializeTradingSession,
    endTradingSession,
    currentStep,
  } = useTrading();

  const handleConnect = async () => {
    if (!eoaAddress) {
      // Step 1: Connect wallet
      await connect();
    } else if (!isTradingSessionComplete) {
      // Step 2: Initialize trading session
      await initializeTradingSession();
    }
  };

  const handleDisconnect = async () => {
    try {
      if (isTradingSessionComplete) {
        endTradingSession();
      }
      await disconnect();
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  // Determine button state and text
  const getButtonState = () => {
    if (!eoaAddress) {
      return {
        text: "Connect Wallet",
        onClick: handleConnect,
        disabled: false,
        variant: "primary" as const,
      };
    }
    if (!isTradingSessionComplete) {
      return {
        text: currentStep !== "idle" ? "Initializing..." : "Initialize Trading Session",
        onClick: handleConnect,
        disabled: currentStep !== "idle",
        variant: "primary" as const,
      };
    }
    return {
      text: "Disconnect",
      onClick: handleDisconnect,
      disabled: false,
      variant: "secondary" as const,
    };
  };

  const buttonState = getButtonState();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 overflow-x-auto md:overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center w-full">
          {/* Left side: Brand */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-slate-900">
              UseBofet
            </span>
          </div>

          {/* Right side: Connect/Disconnect Button */}
          <div className="flex items-center gap-4">
            {isTradingSessionComplete && (
              <div className="hidden sm:flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded px-4 py-2">
                <span className="text-green-300 font-medium text-sm">Session Active</span>
              </div>
            )}
            <button
              type="button"
              onClick={buttonState.onClick}
              disabled={buttonState.disabled}
              aria-label={buttonState.text}
              className={`btn ${
                buttonState.variant === "primary"
                  ? "btn-primary"
                  : "btn-secondary"
              } ${buttonState.disabled ? "btn-disabled" : ""} ${
                buttonState.variant === "secondary"
                  ? "bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/30"
                  : ""
              }`}
            >
              {buttonState.text}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
