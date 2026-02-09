"use client";

import { ArrowDown } from "lucide-react";
import { useDictionary } from "@/providers/dictionary-provider";

interface InitializeGuideProps {
  onClick: () => void;
  disabled: boolean;
  isInitializing: boolean;
}

export default function InitializeGuide({ onClick, disabled, isInitializing }: InitializeGuideProps) {
  const { dict } = useDictionary();

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-2">
      {/* Animated Arrow */}
      <div className="arrow-bounce flex items-center justify-center">
        <ArrowDown className="w-10 h-10 text-black" strokeWidth={3} />
      </div>

      {/* Animated Oval Button - The actual clickable button */}
      <button
        onClick={onClick}
        disabled={disabled}
        className="relative flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {/* Solid Oval with Green Background - The actual button */}
        <div className="relative bg-[#00C805]/15 border-2 border-[#00A804] rounded-full px-6 py-4 sm:px-8 sm:py-5 flex flex-col items-center justify-center min-w-[200px] sm:min-w-[240px] hover:bg-[#00C805]/25 transition-colors">
          {/* Primary Text: "Haz click aqui" - Reduced size */}
          <p className="text-lg sm:text-xl font-bold text-slate-900 mb-1 tracking-tight">
            {isInitializing 
              ? dict.wallet?.initializingSession ?? "Initializing Trading Session..." 
              : dict.wallet?.clickHere ?? "Haz click aqui"}
          </p>
          
          {/* Secondary Text: "Initialize Trading Session" - Smaller, Green */}
          {!isInitializing && (
            <p className="text-[10px] sm:text-xs text-[#00A804] font-medium">
              {dict.wallet?.initializeGuide ?? "Initialize Trading Session"}
            </p>
          )}
        </div>
      </button>
    </div>
  );
}
