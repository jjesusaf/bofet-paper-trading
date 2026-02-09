import { cn } from "@/utils/classNames";
import { useDictionary } from "@/providers/dictionary-provider";

export default function SessionStatus({
  isComplete,
}: {
  isComplete: boolean | undefined;
}) {
  const { dict } = useDictionary();
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{dict.trading?.session?.title ?? "Trading Session"}</h3>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isComplete ? "bg-green-500" : "bg-gray-500"
          )}
        />
        <span className="text-sm text-slate-600">
          {isComplete ? dict.trading?.session?.ready ?? "Ready to Trade" : dict.trading?.session?.notInitialized ?? "Not Initialized"}
        </span>
      </div>
    </div>
  );
}
