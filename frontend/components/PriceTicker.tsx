"use client";

import { usePrices } from "@/lib/prices";
import { TrendingUp, TrendingDown } from "lucide-react";

export function PriceTicker() {
  const prices = usePrices();
  const items = prices ? Object.values(prices) : [];
  if (items.length === 0) return null;
  const loop = [...items, ...items];
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20">
      <div className="ticker flex w-max items-center gap-8 py-2 px-4">
        {loop.map((p, i) => {
          const up = p.change24h >= 0;
          return (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm">
              <span className="font-semibold text-white">{p.symbol}</span>
              <span className="text-white/70">
                ${p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
              <span
                className={
                  "flex items-center gap-0.5 " + (up ? "text-up" : "text-down")
                }
              >
                {up ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(p.change24h).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
