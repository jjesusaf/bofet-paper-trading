import { erc20Abi, formatUnits } from "viem";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/providers/WalletContext";
import { getRpcNode } from "@/constants/polymarket";
import { getPolygonRpcClient } from "@/utils/polygonGas";
import {
  USDC_E_CONTRACT_ADDRESS,
  USDC_E_DECIMALS,
  USDC_CONTRACT_ADDRESS,
  USDC_DECIMALS,
} from "@/constants/tokens";
import { QUERY_STALE_TIMES, QUERY_REFETCH_INTERVALS } from "@/constants/query";

/**
 * Polygon balance reads. RPC is chosen by NEXT_PUBLIC_RPC_NODE:
 * - magic: use wallet (Magic) publicClient — can hit rate limit if polling is heavy.
 * - public | private: use dedicated node (recommended to avoid Magic rate limit).
 */
export default function usePolygonBalances(address: string | undefined) {
  const rpcNode = getRpcNode();
  const { publicClient: magicClient } = useWallet();
  const publicClient =
    rpcNode === "magic" ? magicClient : getPolygonRpcClient();
  const enabled = !!address && (rpcNode !== "magic" || !!magicClient);

  const {
    data: usdcBalance,
    isLoading: isLoadingUsdcE,
    error: usdcError,
  } = useQuery({
    queryKey: ["usdcBalance", address],
    queryFn: async () => {
      if (!address || !publicClient) return null;

      const balance = await publicClient.readContract({
        address: USDC_E_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      return balance;
    },
    enabled,
    staleTime: QUERY_STALE_TIMES.BALANCE,
    refetchInterval: QUERY_REFETCH_INTERVALS.BALANCE,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const {
    data: nativeUsdcBalance,
    isLoading: isLoadingNativeUsdc,
    error: nativeUsdcError,
  } = useQuery({
    queryKey: ["nativeUsdcBalance", address],
    queryFn: async () => {
      if (!address || !publicClient) return null;

      const balance = await publicClient.readContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      });

      return balance;
    },
    enabled,
    staleTime: QUERY_STALE_TIMES.BALANCE,
    refetchInterval: QUERY_REFETCH_INTERVALS.BALANCE,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  const formattedUsdcBalance = usdcBalance
    ? parseFloat(formatUnits(usdcBalance, USDC_E_DECIMALS))
    : 0;

  const formattedNativeUsdcBalance = nativeUsdcBalance
    ? parseFloat(formatUnits(nativeUsdcBalance, USDC_DECIMALS))
    : 0;

  return {
    usdcBalance: formattedUsdcBalance,
    formattedUsdcBalance: formattedUsdcBalance.toFixed(2),
    rawUsdcBalance: usdcBalance,
    nativeUsdcBalance: formattedNativeUsdcBalance,
    formattedNativeUsdcBalance: formattedNativeUsdcBalance.toFixed(2),
    rawNativeUsdcBalance: nativeUsdcBalance,
    isLoading: isLoadingUsdcE || isLoadingNativeUsdc,
    isError: !!usdcError || !!nativeUsdcError,
  };
}
