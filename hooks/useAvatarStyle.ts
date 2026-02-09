"use client";

import { useState, useEffect, useCallback } from "react";

export type AvatarStyle = "notionists" | "avataaars" | "fun-emoji" | "lorelei" | "adventurer" | "bottts" | "pixel-art";

const AVATAR_STYLE_KEY = "bofet-avatar-style";
const AVATAR_STYLE_EVENT = "bofet-avatar-style-change";
const DEFAULT_STYLE: AvatarStyle = "pixel-art";

export default function useAvatarStyle() {
  const [avatarStyle, setAvatarStyleState] = useState<AvatarStyle>(DEFAULT_STYLE);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AVATAR_STYLE_KEY);
      if (saved && isValidAvatarStyle(saved)) {
        setAvatarStyleState(saved as AvatarStyle);
      }
    } catch (error) {
      console.error("Error loading avatar style from localStorage:", error);
    }
  }, []);

  // Listen for changes from other hook instances in the same tab
  useEffect(() => {
    const handleChange = (e: Event) => {
      const style = (e as CustomEvent).detail as AvatarStyle;
      if (isValidAvatarStyle(style)) {
        setAvatarStyleState(style);
      }
    };

    window.addEventListener(AVATAR_STYLE_EVENT, handleChange);
    return () => window.removeEventListener(AVATAR_STYLE_EVENT, handleChange);
  }, []);

  // Save to localStorage and notify all hook instances
  const setAvatarStyle = useCallback((style: AvatarStyle) => {
    try {
      localStorage.setItem(AVATAR_STYLE_KEY, style);
      setAvatarStyleState(style);

      // Dispatch custom event so all other hook instances update too
      window.dispatchEvent(new CustomEvent(AVATAR_STYLE_EVENT, { detail: style }));
    } catch (error) {
      console.error("Error saving avatar style to localStorage:", error);
    }
  }, []);

  return { avatarStyle, setAvatarStyle };
}

function isValidAvatarStyle(style: string): boolean {
  const validStyles: AvatarStyle[] = [
    "notionists",
    "avataaars",
    "fun-emoji",
    "lorelei",
    "adventurer",
    "bottts",
    "pixel-art",
  ];
  return validStyles.includes(style as AvatarStyle);
}
