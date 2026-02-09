"use client";

import Script from "next/script";
import { useWallet } from "@/providers/WalletContext";

const HEYO_SCRIPT_URL =
  "https://heyo.so/embed/script?projectId=6983de671352a14c688b60c8";

export default function HeyoEmbedScript() {
  const { eoaAddress } = useWallet();

  if (!eoaAddress) {
    return null;
  }

  return (
    <Script src={HEYO_SCRIPT_URL} strategy="afterInteractive" id="heyo-embed" />
  );
}
