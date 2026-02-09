"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useNavigationLoading } from "@/providers/NavigationLoadingProvider";

export default function NavigationLoader() {
  const { isLoading } = useNavigationLoading();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  // Show loader instantly when loading starts, hide when loading stops
  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isLoading]);

  // Hide loader when pathname changes (navigation complete)
  useEffect(() => {
    if (pathname) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="navigation-loader"></div>
    </div>
  );
}
