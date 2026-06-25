"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS, type MarketView } from "@/lib/contract";
import { formatEther } from "viem";
import { motion } from "framer-motion";

export function Leaderboard() {
  const { data: count } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "marketCount",
  });
  const n = count ? Number(count) : 0;
  const ids = Array.from({ length: n }, (_, i) => BigInt(i + 1));

  const { data: markets, isLoading } = useReadContracts({
    contracts: ids.map((id) => ({
      address: MARKET_ADDRESS,
      abi: marketAbi,
      functionName: "getMarket",
      args: [id],
    })),
    query: { enabled: n > 0 },
  });

  if (n === 0) {
    return (
      <p className="glass rounded-3xl p-8 text-center text-white/50">No markets yet.</p>
    );
  }
  if (isLoading || !markets) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass h-20 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  const rows = markets
    .map((r, i) => {
      const m = r.result as unknown as MarketView | undefined;
      if (!m) return null;
      const pool = m.poolYes + m.poolNo;
      return { id: ids[i], m, pool };
    })
    .filter((x): x is { id: bigint; m: MarketView; pool: bigint } => x !== null)
    .sort((a, b) => (b.pool > a.pool ? 1 : b.pool < a.pool ? -1 : 0));

  const max = rows.length ? rows[0].pool : 0n;

  return (
    <div className="space-y-3">
      {rows.map((row, i) => {
        const pct = max > 0n ? Number((row.pool * 1000n) / max) / 10 : 0;
        const resolved = row.m.outcome !== 0;
        return (
          <motion.div
            key={row.id.toString()}
            initial={ { opacity: 0, y: 10 } }
            animate={ { opacity: 1, y: 0 } }
            transition={ { delay: i * 0.04 } }
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">
              <span
                className={
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold " +
                  (i === 0 ? "bg-brand text-white" : "bg-white/5 text-white/60")
                }
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{row.m.question}</p>
                <p className="text-xs text-white/40">
                  {row.m.asset} · {resolved ? "Resolved" : "Open"}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-brand to-brand-400"
                    style={ { width: `${pct}%` } }
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-brand-400">
                  {Number(formatEther(row.pool)).toFixed(3)}
                </p>
                <p className="text-[10px] uppercase text-white/40">RITUAL</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
