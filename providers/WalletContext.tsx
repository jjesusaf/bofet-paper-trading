import { createContext, useContext } from "react";
import { Magic as MagicBase } from "magic-sdk";
import { PublicClient, WalletClient } from "viem";
import { providers } from "ethers";

export interface WalletContextType {
  magic: MagicBase | null;
  eoaAddress: `0x${string}` | undefined;
  userEmail: string | null;
  walletClient: WalletClient | null;
  ethersSigner: providers.JsonRpcSigner | null;
  publicClient: PublicClient | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  syncWalletState: () => Promise<void>;
  isConnected: boolean;
}

export const WalletContext = createContext<WalletContextType>({
  magic: null,
  eoaAddress: undefined,
  userEmail: null,
  walletClient: null,
  ethersSigner: null,
  publicClient: null,
  connect: async () => {},
  disconnect: async () => {},
  syncWalletState: async () => {},
  isConnected: false,
});

export function useWallet(): WalletContextType {
  return useContext(WalletContext);
}
