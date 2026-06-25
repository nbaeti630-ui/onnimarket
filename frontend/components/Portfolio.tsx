"use client";

import { useAccount, useReadContract } from "wagmi";
import { marketAbi, MARKET_ADDRESS } from "@/lib/contract";
import { PortfolioRow } from "./PortfolioRow";
import { Wallet } from "lucide-react";

export function Portfolio() {
  const { address, isConnected } = useAccount();
  const { data: count, isLoading } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "marketCount",
  });

  if (!isConnected || !address) {
    return (
      <div className="glass rounded-3xl p-10 text-center text-white/60">
        <Wallet className="mx-auto mb-3 text-brand-400" />
        Connect your wallet to see your positions.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-48 rounded-3xl" />
        ))}
      </div>
    );
  }

  const n = count ? Number(count) : 0;
  if (n === 0) {
    return (
      <div className="glass rounded-3xl p-10 text-center text-white/60">
        No markets yet.
      </div>
    );
  }

  const ids = Array.from({ length: n }, (_, i) => BigInt(n - i));
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((id, i) => (
          <PortfolioRow key={id.toString()} id={id} address={address} index={i} />
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-white/30">
        Markets you've bet on show up here. Place a bet to get started.
      </p>
    </>
  );
}
