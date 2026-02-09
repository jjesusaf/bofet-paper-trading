"use client";

import { useTrading } from "@/providers/TradingProvider";
import Navbar from "@/components/Navbar";
import Profile from "@/views/Profile";
import GeoBlockedBanner from "@/components/GeoBlockedBanner";

export default function ProfilePage() {
  const {
    endTradingSession,
    isGeoblocked,
    isGeoblockLoading,
    geoblockStatus,
  } = useTrading();

  return (
    <div className="min-h-screen bg-[#F8FAFC] transition-colors duration-200 overflow-x-hidden">
      <Navbar />
      
      <main className="max-w-7xl mx-auto pt-20">
        {isGeoblocked && !isGeoblockLoading && (
          <GeoBlockedBanner geoblockStatus={geoblockStatus} />
        )}

        <Profile />
      </main>
    </div>
  );
}
