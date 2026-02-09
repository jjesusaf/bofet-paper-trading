"use client";

import { useState } from "react";
import useOpenOrders, { type OpenOrder } from "@/hooks/useOpenOrders";
import { useDictionary } from "@/providers/dictionary-provider";

type OpenOrdersPanelProps = {
  tokenIds?: string[]; // Optional: filter by token IDs (for YES and NO tokens)
};

export default function OpenOrdersPanel({ tokenIds }: OpenOrdersPanelProps) {
  const { orders, isLoading, error, cancelOrder } = useOpenOrders();
  const { dict } = useDictionary();
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);

  // Filter orders by tokenIds if provided (match any token in the array)
  const filteredOrders = tokenIds && tokenIds.length > 0
    ? orders.filter((order) => tokenIds.includes(order.asset_id))
    : orders;

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancelingOrderId(orderId);
      await cancelOrder(orderId);
    } catch (err) {
      console.error("Failed to cancel order:", err);
      alert("Error al cancelar la orden. Intenta de nuevo.");
    } finally {
      setCancelingOrderId(null);
    }
  };

  // Don't render if no orders and not loading
  if (!isLoading && filteredOrders.length === 0) {
    return null;
  }

  return (
    <div className="card bg-base-100 border border-base-300 mb-8">
      <div className="card-body p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="card-title text-lg font-bold text-base-content">
            Órdenes Abiertas
          </h3>
          {filteredOrders.length > 0 && (
            <div className="badge badge-primary badge-sm">
              {filteredOrders.length}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error.message}</span>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && !error && filteredOrders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th className="text-xs font-semibold text-base-content/70">
                    {dict.marketDetail?.openOrders?.side ?? "Tipo"}
                  </th>
                  <th className="text-xs font-semibold text-base-content/70">
                    {dict.marketDetail?.openOrders?.size ?? "Shares"}
                  </th>
                  <th className="text-xs font-semibold text-base-content/70">
                    {dict.marketDetail?.openOrders?.price ?? "Precio"}
                  </th>
                  <th className="text-xs font-semibold text-base-content/70">
                    {dict.marketDetail?.openOrders?.total ?? "Total"}
                  </th>
                  <th className="text-xs font-semibold text-base-content/70"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const size = parseFloat(order.original_size);
                  const price = parseFloat(order.price);
                  const total = size * price;
                  const isCanceling = cancelingOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover">
                      <td>
                        <span
                          className={`badge badge-sm ${
                            order.side === "BUY"
                              ? "badge-success"
                              : "badge-error"
                          }`}
                        >
                          {order.side === "BUY"
                            ? dict.marketDetail?.openOrders?.buy ?? "Compra"
                            : dict.marketDetail?.openOrders?.sell ?? "Venta"}
                        </span>
                      </td>
                      <td className="font-medium text-base-content">
                        {size.toFixed(2)}
                      </td>
                      <td className="font-medium text-base-content">
                        {(price * 100).toFixed(1)}¢
                      </td>
                      <td className="font-semibold text-base-content">
                        ${total.toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={isCanceling}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                        >
                          {isCanceling ? (
                            <span className="loading loading-spinner loading-xs"></span>
                          ) : (
                            dict.marketDetail?.openOrders?.cancel ?? "Cancelar"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-base-content/30 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm text-base-content/60">
              {dict.marketDetail?.openOrders?.empty ??
                "No tienes órdenes abiertas"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
