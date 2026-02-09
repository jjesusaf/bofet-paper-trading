"use client";

import React, { useState } from "react";
import { useWallet } from "@/providers/WalletContext";
import { Eye, Wallet, X } from "lucide-react";

interface ConnectWalletUIProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectWalletUI({ isOpen, onClose }: ConnectWalletUIProps) {
  const { eoaAddress, connect, disconnect, magic } = useWallet();
  const [isRevealing, setIsRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRevealPrivateKey = async () => {
    if (!magic || !eoaAddress) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setIsRevealing(true);
      setError(null);

      // Reveal private key using Magic SDK
      // Since Magic SDK v31.0.0, use revealEVMPrivateKey() for EVM chains
      // This opens a secure Magic iframe that displays the private key to the user
      // The promise resolves when the user closes the iframe
      await magic.user.revealEVMPrivateKey();

    } catch (err: any) {
      console.error("Error revealing private key:", err);
      setError(err.message || "Failed to reveal private key");
    } finally {
      setIsRevealing(false);
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      await connect();
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await disconnect();
    } catch (err: any) {
      setError(err.message || "Failed to disconnect wallet");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00C805]/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-[#00C805]" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Wallet Manager</h2>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-circle btn-sm"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Wallet Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                <div className={`w-2 h-2 rounded-full ${eoaAddress ? 'bg-green-500' : 'bg-slate-400'}`} />
                <span className="text-sm text-slate-900">
                  {eoaAddress ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>

            {/* Wallet Address */}
            {eoaAddress && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Wallet Address</label>
                <div className="p-3 rounded-lg bg-slate-50 font-mono text-xs text-slate-900 break-all">
                  {eoaAddress}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="alert alert-error py-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-5 w-5"
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
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Private Key Section */}
            {eoaAddress && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Export Private Key</label>
                  <p className="text-xs text-slate-500">
                    View your private key in a secure Magic modal. You can copy it to import your wallet into other applications.
                  </p>
                  <button
                    onClick={handleRevealPrivateKey}
                    disabled={isRevealing}
                    className="w-full btn bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200"
                  >
                    {isRevealing ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Opening secure view...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Reveal Private Key
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-5 w-5 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="text-xs text-amber-800">
                    <strong>Warning:</strong> Never share your private key with anyone. Anyone with access to your private key can control your wallet and funds.
                  </div>
                </div>
              </div>
            )}

            {/* Connect/Disconnect Button */}
            <div className="pt-2">
              {eoaAddress ? (
                <button
                  onClick={handleDisconnect}
                  className="w-full btn bg-gray-100 hover:bg-gray-200 text-gray-900 border-none"
                >
                  Disconnect Wallet
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="w-full btn bg-[#00C805] hover:bg-[#00A804] text-white border-none"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
