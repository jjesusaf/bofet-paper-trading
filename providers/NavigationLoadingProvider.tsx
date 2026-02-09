"use client";

import { createContext, useContext, useState, useEffect, ReactNode, Suspense, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavigationLoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType | undefined>(undefined);

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (context === undefined) {
    throw new Error("useNavigationLoading must be used within a NavigationLoadingProvider");
  }
  return context;
}

// Internal component that watches searchParams changes
// Must be wrapped in Suspense because useSearchParams() requires it
function NavigationParamsWatcher() {
  const searchParams = useSearchParams();
  const { stopLoading } = useNavigationLoading();

  // Stop loading when searchParams change
  useEffect(() => {
    stopLoading();
  }, [searchParams, stopLoading]);

  return null;
}

export function NavigationLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Stop loading when pathname changes
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <NavigationLoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      <Suspense fallback={null}>
        <NavigationParamsWatcher />
      </Suspense>
      {children}
    </NavigationLoadingContext.Provider>
  );
}
