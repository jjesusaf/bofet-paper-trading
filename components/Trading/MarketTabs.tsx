"use client";

import { useState } from "react";

import Card from "@/components/shared/Card";
import ActiveOrders from "@/components/Trading/Orders";
import PaperUserPositions from "@/components/Trading/Positions/PaperUserPositions";
import HighVolumeMarkets from "@/components/Trading/Markets";

type TabId = "positions" | "orders" | "markets";

interface MarketTabsProps {
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

export default function MarketTabs(props: MarketTabsProps = {}) {
  const { activeTab: propActiveTab } = props;
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>("markets");
  
  // Use props if provided, otherwise use internal state
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;

  return (
    <Card className="px-6">
      {/* Tab Content */}
      <div>
        {activeTab === "positions" && <PaperUserPositions />}
        {activeTab === "orders" && <ActiveOrders />}
        {activeTab === "markets" && <HighVolumeMarkets />}
      </div>
    </Card>
  );
}
