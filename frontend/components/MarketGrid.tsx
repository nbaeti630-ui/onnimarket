"use client";

import { useReadContract } from "wagmi";
import { marketAbi, MARKET_ADDRESS } from "@/lib/contract";
import { MarketCard } from "./MarketCard";

export function MarketGrid() {
  const { data: count, isLoading } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "marketCount",
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-56 rounded-3xl" />
        ))}
      </div>
    );
  }

  const n = count ? Number(count) : 0;
  if (n === 0) {
    return (
      <div className="glass rounded-3xl p-10 text-center text-white/60">
        No markets yet. Create the first one!
      </div>
    );
  }

  const ids = Array.from({ length: n }, (_, i) => BigInt(n - i)); // newest first
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {ids.map((id, i) => (
        <MarketCard key={id.toString()} id={id} index={i} />
      ))}
    </div>
  );
}
