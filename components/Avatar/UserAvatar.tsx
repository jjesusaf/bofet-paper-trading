"use client";

import { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";

export type AvatarStyle = "notionists" | "avataaars" | "fun-emoji" | "lorelei" | "adventurer" | "bottts" | "pixel-art";

interface UserAvatarProps {
  seed?: string;
  size?: number;
  className?: string;
  style?: AvatarStyle;
}

export default function UserAvatar({
  seed,
  size = 96,
  className = "",
  style = "pixel-art",
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const avatarUrl = seed
    ? `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
    : null;

  if (!avatarUrl || imageError) {
    return (
      <div
        className={`rounded-full bg-slate-200 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <User className="text-slate-400" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden bg-slate-100 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={avatarUrl}
        alt="User avatar"
        width={size}
        height={size}
        className="w-full h-full"
        onError={() => setImageError(true)}
        priority
      />
    </div>
  );
}
