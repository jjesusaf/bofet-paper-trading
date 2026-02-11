  import { Magic } from "magic-sdk";

  let magicBaseSepoliaInstance: Magic | null = null;

  export default function getMagicBaseSepolia(): Magic {
    if (!magicBaseSepoliaInstance && typeof window !== "undefined") {
      magicBaseSepoliaInstance = new Magic(
        process.env.NEXT_PUBLIC_MAGIC_API_KEY!,
        {
          network: {
            rpcUrl: "https://sepolia.base.org",
            chainId: 84532,
          },
        }
      );
    }
    return magicBaseSepoliaInstance!;
  }