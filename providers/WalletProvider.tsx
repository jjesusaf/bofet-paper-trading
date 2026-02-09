"use client";

import { ReactNode, useEffect, useMemo, useState, useCallback } from "react";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  WalletClient,
} from "viem";
import getMagic from "@/lib/magic";
import { providers } from "ethers";
import { polygon } from "viem/chains";
import { WalletContext, WalletContextType } from "./WalletContext";
import { POLYGON_RPC_URL } from "@/constants/polymarket";

const publicClient = createPublicClient({
  chain: polygon,
  transport: http(POLYGON_RPC_URL),
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [ethersSigner, setEthersSigner] =
    useState<providers.JsonRpcSigner | null>(null);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [eoaAddress, setEoaAddress] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const magic = getMagic();
    if (!magic) return;

    const client = createWalletClient({
      chain: polygon,
      transport: custom(magic.rpcProvider as any),
    });

    const ethersProvider = new providers.Web3Provider(magic.rpcProvider as any);

    setWalletClient(client);
    setEthersSigner(ethersProvider.getSigner());

    magic.user.isLoggedIn().then((isLoggedIn) => {
      if (isLoggedIn) {
        fetchUser();
      }
    });
  }, []);

  const checkOrCreateRegistrationTimestamp = async (address: string) => {
    try {
      const key = `app:user:registration:${address}`;

      // Consultar si ya existe el timestamp
      const response = await fetch(`/api/redis?key=${encodeURIComponent(key)}`);

      if (!response.ok) {
        console.error('[Registration] Failed to check Redis');
        return;
      }

      const data = await response.json();

      // Si no existe timestamp, crearlo
      if (!data.value) {
        const timestamp = new Date().toISOString();
        const createResponse = await fetch("/api/redis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: key,
            value: timestamp,
          }),
        });

        if (createResponse.ok) {
          console.log(`[Registration] ✅ New user registered: ${address} at ${timestamp}`);
        } else {
          console.error('[Registration] Failed to create timestamp in Redis');
        }
      } else {
        console.log(`[Registration] 👤 Existing user: ${address}, registered at ${data.value}`);
      }
    } catch (error) {
      console.error('[Registration] Error checking/creating timestamp:', error);
    }
  };

  const fetchUser = useCallback(async () => {
    const magic = getMagic();
    if (!magic) return;
    const userInfo = await magic.user.getInfo();
    const address = (userInfo as any).wallets?.ethereum?.publicAddress;
    const email = (userInfo as any).email;
    setEoaAddress(address ? (address as `0x${string}`) : undefined);
    setUserEmail(email || null);

    // Crear/verificar timestamp de registro
    if (address) {
      await checkOrCreateRegistrationTimestamp(address);
    }
  }, []);

  const connect = useCallback(async () => {
    // Redirect to sign-in page instead of opening Magic widget
    // Extract locale from current URL path (e.g., /es/... or /en/...)
    const pathSegments = window.location.pathname.split("/");
    const locale = pathSegments[1] || "es";

    // Save current path to sessionStorage for redirect after trading session initialization
    const currentPath = window.location.pathname;
    // Only save if not on home page or signin page
    if (currentPath !== `/${locale}` && !currentPath.includes('/signin')) {
      sessionStorage.setItem('redirectAfterInit', currentPath);
      console.log('[WalletProvider] Saved redirect path:', currentPath);
    }

    window.location.href = `/${locale}/signin`;
  }, []);

  const syncWalletState = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const disconnect = useCallback(async () => {
    const magic = getMagic();
    if (!magic) return;
    try {
      await magic.user.logout();
      setEoaAddress(undefined);
      setUserEmail(null);
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  }, []);

  const value = useMemo<WalletContextType>(
    () => ({
      magic: getMagic(),
      eoaAddress,
      userEmail,
      walletClient,
      ethersSigner,
      publicClient,
      connect,
      disconnect,
      syncWalletState,
      isConnected: !!eoaAddress,
    }),
    [eoaAddress, userEmail, walletClient, ethersSigner, connect, disconnect, syncWalletState]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
