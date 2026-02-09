import { Magic } from "magic-sdk";
import { polygon } from "viem/chains";
import { POLYGON_PRIVATE_RPC_URL } from "@/constants/polymarket";

let magicInstance: Magic | null = null;

// Helper to detect test environment
function isTestEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  
  // Check multiple ways to detect test environment
  const nodeEnv = process.env.NODE_ENV;
  const testModeFlag = process.env.NEXT_PUBLIC_MAGIC_TEST_MODE;
  const isVitestBrowser = (window as any).__VITEST_BROWSER__;
  const isVitest = typeof (window as any).__vitest_worker__ !== "undefined";
  
  return (
    nodeEnv === "test" ||
    testModeFlag === "true" ||
    isVitestBrowser === true ||
    isVitest === true
  );
}

export default function getMagic(): Magic {
  if (!magicInstance && typeof window !== "undefined") {
    // Force test mode in test environment
    const isTestMode = isTestEnvironment();
    
    // Always enable test mode in browser test environment
    // Magic SDK requires testMode: true (boolean) to enable test mode
    // Check if we're running in Vitest browser mode
    const isVitestBrowser = typeof (window as any).__vitest_worker__ !== "undefined" ||
                           typeof (window as any).__VITEST_BROWSER__ !== "undefined";
    
    // Enable test mode if we're in test environment OR in Vitest browser
    const shouldUseTestMode = isTestMode || isVitestBrowser;
    
    // Magic's backend uses this RPC for internal calls and for broadcasting eth_sendTransaction.
    // Publicnode can yield "Failed to fetch" when Magic broadcasts; BlockPI (private RPC) is used for reliability.
    const rpcUrl = POLYGON_PRIVATE_RPC_URL;
    const config: any = {
      network: { rpcUrl, chainId: polygon.id },
    };
    
    // Always set testMode to true in test environments
    // This is REQUIRED for Magic SDK test mode to work
    if (shouldUseTestMode) {
      config.testMode = true; // Explicitly set to boolean true
    }
    
    magicInstance = new Magic(process.env.NEXT_PUBLIC_MAGIC_API_KEY!, config);
    // magicInstance = new Magic(process.env.NEXT_PUBLIC_MAGIC_API_KEY!, { testMode: true });
  }
  return magicInstance!;
}

// Export function to reset Magic instance (useful for tests)
export function resetMagicInstance(): void {
  magicInstance = null;
}
