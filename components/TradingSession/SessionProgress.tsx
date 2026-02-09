import { SessionStep } from "@/utils/session";
import { useDictionary } from "@/providers/dictionary-provider";

export default function SessionProgress({
  currentStep,
}: {
  currentStep: SessionStep;
}) {
  const { dict } = useDictionary();
  if (currentStep === "idle" || currentStep === "complete") return null;

  const getProgressText = () => {
    switch (currentStep) {
      case "checking":
        return dict.trading?.session?.checkingSafe ?? "Checking Safe deployment...";
      case "deploying":
        return dict.trading?.session?.deployingSafe ?? "Deploying Safe wallet...";
      case "credentials":
        return dict.trading?.session?.gettingCredentials ?? "Getting User's API credentials...";
      case "approvals":
        return dict.trading?.session?.settingApprovals ?? "Setting all token approvals...";
      default:
        return "";
    }
  };

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
        <p className="text-sm font-medium text-purple-700">
          {getProgressText()}
        </p>
      </div>
    </div>
  );
}
