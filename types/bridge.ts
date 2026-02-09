/**
 * Types for Polymarket Bridge API
 * Used for automatic USDC → USDC.e conversion
 */

// Bridge deposit address response from Polymarket API
export interface BridgeDepositResponse {
  address: {
    evm: string; // Polygon/EVM deposit address
    svm?: string; // Solana deposit address (optional)
    btc?: string; // Bitcoin deposit address (optional)
  };
}

// Bridge deposit request body
export interface BridgeDepositRequest {
  address: string; // User's Safe wallet address
}

// Bridge status response from Polymarket API
// https://docs.polymarket.com/api-reference/bridge/get-deposit-status
export type BridgeTransactionStatus =
  | "DEPOSIT_DETECTED" // Deposit detected but not yet processing
  | "PROCESSING" // Transaction is being routed and swapped
  | "ORIGIN_TX_CONFIRMED" // Origin tx confirmed on source chain
  | "SUBMITTED" // Submitted to destination chain
  | "COMPLETED" // Transaction completed successfully
  | "FAILED"; // Transaction encountered an error

export interface BridgeTransaction {
  fromChainId: string;
  fromTokenAddress: string;
  fromAmountBaseUnit: string;
  toChainId: string;
  toTokenAddress: string;
  status: BridgeTransactionStatus;
  txHash?: string; // Present when status is COMPLETED
  createdTimeMs?: number; // Missing when status is DEPOSIT_DETECTED
}

export interface BridgeTransactionStatusResponse {
  transactions: BridgeTransaction[];
}

/** @deprecated Use BridgeTransactionStatusResponse for status endpoint. Kept for 404→pending normalization. */
export interface BridgeStatusResponse {
  status: "pending";
  message?: string;
}

// API error response
export interface BridgeApiError {
  error: string;
  message?: string;
  details?: string;
  code?: number;
}
