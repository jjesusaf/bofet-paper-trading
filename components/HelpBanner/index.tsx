'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/providers/WalletContext';
import { useTrading } from '@/providers/TradingProvider';
import { useDictionary } from '@/providers/dictionary-provider';

const HELP_BANNER_DURATION_DAYS = 7; // Número de días que se mostrará la barra

export function HelpBanner() {
  const { eoaAddress } = useWallet();
  const { safeAddress } = useTrading();
  const { dict } = useDictionary();

  const [isVisible, setIsVisible] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkBannerStatus = async () => {
      if (!eoaAddress || !safeAddress) {
        setIsLoading(false);
        return;
      }

      // Check if user manually dismissed the banner
      const isDismissed = localStorage.getItem(`help_banner_dismissed_${eoaAddress}`);
      if (isDismissed === 'true') {
        setIsVisible(false);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the timestamp from Redis using the Safe address
        const response = await fetch(`/api/redis?key=${encodeURIComponent(safeAddress)}`);

        if (!response.ok) {
          console.error('[HelpBanner] Failed to fetch timestamp from Redis');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        const timestamp = data.value;

        if (!timestamp) {
          console.log('[HelpBanner] No timestamp found in Redis');
          setIsLoading(false);
          return;
        }

        console.log('[HelpBanner] Fetched timestamp:', timestamp);

        // Calculate days since first connection
        const firstConnectionDate = new Date(timestamp);
        const now = new Date();
        const daysSinceConnection = Math.floor((now.getTime() - firstConnectionDate.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = HELP_BANNER_DURATION_DAYS - daysSinceConnection;

        console.log('[HelpBanner] Days since connection:', daysSinceConnection, 'Days remaining:', remaining);

        if (remaining > 0) {
          setDaysRemaining(remaining);
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('[HelpBanner] Error fetching timestamp:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkBannerStatus();
  }, [eoaAddress, safeAddress]);

  const handleDismiss = () => {
    if (eoaAddress) {
      localStorage.setItem(`help_banner_dismissed_${eoaAddress}`, 'true');
    }
    setIsVisible(false);
  };

  if (isLoading || !isVisible) {
    return null;
  }

  const handleBannerClick = () => {
    // TODO: Open help modal or redirect to help page
    console.log('Open help guide');
  };

  return (
    <div id="help" className="bg-gray-100/40 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-center py-3">
          {/* Clickable area */}
          <button
            onClick={handleBannerClick}
            className="flex-1 text-center hover:opacity-80 transition-opacity cursor-pointer"
          >
            <p className="text-sm font-semibold text-black">
              {(dict as any).helpBanner?.title ?? '¿Necesitas ayuda para comenzar?'}{' '}
              {(dict as any).helpBanner?.telegramMessagePrefix ?? 'Mandanos un mensaje en'}{' '}
              <a
                href="https://t.me/+xi6P1cmiRzFjODlh"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                onClick={(e) => e.stopPropagation()}
              >
                {(dict as any).helpBanner?.telegram ?? 'telegram'}
              </a>
            </p>
          </button>

          {/* Close button - absolute positioned */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="absolute right-0 p-2 text-gray-700 hover:text-black transition-colors"
            aria-label={(dict as any).helpBanner?.close ?? 'Cerrar'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
