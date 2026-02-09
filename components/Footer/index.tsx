"use client";

import React from "react";
import { useDictionary } from "@/providers/dictionary-provider";
import { Twitter, Instagram } from "lucide-react";

export default function Footer() {
  const { dict } = useDictionary();

  return (
    <footer className="mt-auto pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-start gap-4">
          {/* Left side: Social Media Links */}
          <div className="flex items-center gap-3">
            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@usebofet.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#00C805] transition-colors"
              aria-label="TikTok"
              title="TikTok"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>

            {/* Twitter/X */}
            <a
              href="https://x.com/usebofet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#00C805] transition-colors"
              aria-label="Twitter/X"
              title="Twitter/X"
            >
              <Twitter className="w-4 h-4" />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/usebofet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-[#00C805] transition-colors"
              aria-label="Instagram"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
          {/* Right side: Logo, Name, Slogan */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-300 shrink-0">
              <img
                src="/boget_logo_white.svg"
                alt={dict.wallet?.logoAlt ?? "UseBofet Logo"}
                className="w-4 h-4 object-contain"
              />
            </div>
            <span className="font-bold text-xs text-gray-900">
              UseBofet.com
            </span>
            <span className="text-xs text-gray-600">
              {dict.footer?.slogan ?? "Trade predictions, earn rewards"}
            </span>
          </div>

          
        </div>
      </div>
    </footer>
  );
}
