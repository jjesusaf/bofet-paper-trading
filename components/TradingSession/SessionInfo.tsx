export default function SessionInfo({
  isComplete,
}: {
  isComplete: boolean | undefined;
}) {
  if (isComplete) return null;

  return (
    <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <p className="font-medium mb-2 text-slate-900">What is a Trading Session?</p>
      <p className="text-xs leading-relaxed text-slate-600 mb-3">
        A trading session initializes all necessary components for gasless
        trading on Polymarket:
      </p>
      <ul className="text-xs leading-relaxed text-slate-600 space-y-1 ml-4 list-disc">
        <li>Sign to deploy Safe wallet (if not already deployed)</li>
        <li>Sign to create user's API credentials for the CLOB client</li>
        <li>Sign to approve all token approvals for trading</li>
      </ul>
    </div>
  );
}
