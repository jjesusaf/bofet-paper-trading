"use client";

import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import useClobOrder from "@/hooks/useClobOrder";
import { useTrading } from "@/providers/TradingProvider";
import useRedeemPosition from "@/hooks/useRedeemPosition";
import useUserPositions, { PolymarketPosition } from "@/hooks/useUserPositions";
import { useDictionary } from "@/providers/dictionary-provider";

import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import LoadingState from "@/components/shared/LoadingState";
import PositionCard from "@/components/Trading/Positions/PositionCard";
import PositionFilters from "@/components/Trading/Positions/PositionFilters";

import { createPollingInterval } from "@/utils/polling";
import { DUST_THRESHOLD } from "@/constants/validation";
import { POLLING_DURATION, POLLING_INTERVAL } from "@/constants/query";

export default function UserPositions() {
  const { clobClient, relayClient, eoaAddress, safeAddress } = useTrading();

  const {
    data: positions,
    isLoading,
    error,
  } = useUserPositions(safeAddress as string | undefined);

  const [hideDust, setHideDust] = useState(true);
  const [redeemingAsset, setRedeemingAsset] = useState<string | null>(null);

  const { redeemPosition, isRedeeming } = useRedeemPosition();
  const { submitOrder, isSubmitting } = useClobOrder(clobClient, eoaAddress);
  const [sellingAsset, setSellingAsset] = useState<string | null>(null);

  const [pendingVerification, setPendingVerification] = useState<
    Map<string, number>
  >(new Map());
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!positions || pendingVerification.size === 0) return;

    const stillPending = new Map<string, number>();

    pendingVerification.forEach((originalSize, asset) => {
      const currentPosition = positions.find((p) => p.asset === asset);
      const currentSize = currentPosition?.size || 0;
      const sizeChanged = currentSize < originalSize;

      if (!sizeChanged) {
        stillPending.set(asset, originalSize);
      }
    });

    if (stillPending.size !== pendingVerification.size) {
      setPendingVerification(stillPending);
    }
  }, [positions, pendingVerification]);

  const handleMarketSell = async (position: PolymarketPosition) => {
    setSellingAsset(position.asset);
    try {
      await submitOrder({
        tokenId: position.asset,
        size: position.size,
        side: "SELL",
        negRisk: position.negativeRisk,
        isMarketOrder: true,
      });

      setPendingVerification((prev) =>
        new Map(prev).set(position.asset, position.size)
      );

      queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });

      createPollingInterval(
        () => {
          queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
        },
        POLLING_INTERVAL,
        POLLING_DURATION
      );

      setTimeout(() => {
        setPendingVerification((prev) => {
          const next = new Map(prev);
          next.delete(position.asset);
          return next;
        });
      }, POLLING_DURATION);
    } catch (err) {
      console.error("Failed to sell position:", err);
      alert("Failed to sell position. Please try again.");
    } finally {
      setSellingAsset(null);
    }
  };

  const { dict } = useDictionary();

  const handleRedeem = async (position: PolymarketPosition) => {
    if (!relayClient) {
      alert(dict.trading?.positions?.relayNotInitialized ?? "Relay client not initialized");
      return;
    }

    setRedeemingAsset(position.asset);
    try {
      await redeemPosition(relayClient, {
        conditionId: position.conditionId,
        outcomeIndex: position.outcomeIndex,
        negativeRisk: position.negativeRisk,
        size: position.size,
      });

      queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
      queryClient.invalidateQueries({ queryKey: ["polygon-balances"] });

      createPollingInterval(
        () => {
          queryClient.invalidateQueries({ queryKey: ["polymarket-positions"] });
          queryClient.invalidateQueries({ queryKey: ["polygon-balances"] });
        },
        POLLING_INTERVAL,
        POLLING_DURATION
      );
    } catch (err) {
      console.error("Failed to redeem position:", err);
      alert(dict.trading?.positions?.redeemFailed ?? "Failed to redeem position. Please try again.");
    } finally {
      setRedeemingAsset(null);
    }
  };

  const activePositions = useMemo(() => {
    if (!positions) return [];

    let filtered = positions.filter((p) => p.size >= DUST_THRESHOLD);

    if (hideDust) {
      filtered = filtered.filter((p) => p.currentValue >= DUST_THRESHOLD);
    }

    return filtered;
  }, [positions, hideDust]);

  if (isLoading) {
    return <LoadingState message={dict.trading?.positions?.loading ?? "Loading positions..."} />;
  }

  if (error) {
    return <ErrorState error={error} title={dict.trading?.positions?.errorLoading ?? "Error loading positions"} />;
  }

  if (!positions || activePositions.length === 0) {
    return (
      <EmptyState
        title={dict.trading?.positions?.noPositions ?? "No Open Positions"}
        message={dict.trading?.positions?.noPositionsMessage ?? "You don't have any open positions."}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Position Count and Dust Toggle */}
      <PositionFilters
        positionCount={activePositions.length}
        hideDust={hideDust}
        onToggleHideDust={() => setHideDust(!hideDust)}
      />

      {/* Dust Warning Alert */}
      {hideDust && positions && positions.length > activePositions.length && (
        <div className="alert alert-warning shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <div className="font-bold">
              {positions.length - activePositions.length} {dict.trading?.positions?.dustPositionsHidden ?? "dust position(s) hidden"}
            </div>
            <div className="text-sm">
              {dict.trading?.positions?.dustThreshold ?? `Positions with value < $${DUST_THRESHOLD.toFixed(2)}`}
            </div>
          </div>
        </div>
      )}

      {/* Positions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {activePositions.map((position) => (
          <PositionCard
            key={`${position.conditionId}-${position.outcomeIndex}`}
            position={position}
            onRedeem={handleRedeem}
            onSell={handleMarketSell}
            isSelling={sellingAsset === position.asset}
            isRedeeming={redeemingAsset === position.asset}
            isPendingVerification={pendingVerification.has(position.asset)}
            isSubmitting={isSubmitting}
            canSell={!!clobClient}
            canRedeem={!!relayClient}
          />
        ))}
      </div>
    </div>
  );
}
