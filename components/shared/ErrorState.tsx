import { ERROR_STYLES } from "@/constants/ui";
import { useDictionary } from "@/providers/dictionary-provider";

interface ErrorStateProps {
  error: Error | string | unknown;
  title?: string;
}

export default function ErrorState({
  error,
  title,
}: ErrorStateProps) {
  const { dict } = useDictionary();
  const defaultTitle = title ?? dict.common?.error ?? "Error";
  const errorMessage =
    error instanceof Error ? error.message : String(error ?? dict.common?.unknownError ?? "Unknown error");

  return (
    <div className={ERROR_STYLES}>
      <p className="text-center text-red-300">
        {defaultTitle}: {errorMessage}
      </p>
    </div>
  );
}
