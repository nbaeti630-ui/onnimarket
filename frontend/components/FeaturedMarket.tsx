"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { motion } from "framer-motion";
import { marketAbi, MARKET_ADDRESS, type MarketView } from "@/lib/contract";
import { formatEther } from "viem";
import { Star, TrendingUp } from "lucide-react";

export function FeaturedMarket() {
  const { data: count } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "marketCount",
  });
  const n = count ? Number(count) : 0;
  const ids = Array.from({ length: n }, (_, i) => BigInt(i + 1));
  const { data: markets } = useReadContracts({
    contracts: ids.map((id) => ({
      address: MARKET_ADDRESS,
      abi: marketAbi,
      functionName: "getMarket",
      args: [id],
    })),
    query: { enabled: n > 0 },
  });
  if (n === 0 || !markets) return null;

  let pick: MarketView | null = null;
  let pickPool = -1n;
  markets.forEach((r) => {
    const mm = r.result as unknown as MarketView | undefined;
    if (!mm || mm.outcome !== 0) return;
    const pool = mm.poolYes + mm.poolNo;
    if (pool > pickPool) {
      pickPool = pool;
      pick = mm;
    }
  });
  if (!pick) {
    const last = markets[markets.length - 1]?.result as unknown as
      | MarketView
      | undefined;
    if (last) pick = last;
  }
  if (!pick) return null;

  const m = pick as MarketView;
  const pool = m.poolYes + m.poolNo;
  const total = Number(m.poolYes + m.poolNo);
  const yesPct = total > 0 ? (Number(m.poolYes) / total) * 100 : 50;
  const resolved = m.outcome !== 0;

  return (
    <motion.div
      initial={ { opacity: 0, y: 16 } }
      animate={ { opacity: 1, y: 0 } }
      className="glass relative overflow-hidden rounded-3xl p-6"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand/20 blur-3xl" />
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-400">
        <Star className="h-4 w-4" />
        Featured market
      </div>
      <h2 className="mt-3 text-2xl font-bold leading-snug text-white">
        {m.question}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/50">
        <span className="uppercase">{m.asset}</span>
        <span>Target ${m.targetPrice.toString()}</span>
        {resolved && <span className="text-up">Resolved</span>}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="font-medium text-up">YES {yesPct.toFixed(0)}%</span>
        <span className="font-medium text-down">NO {(100 - yesPct).toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-up to-up/70"
          style={ { width: `${yesPct}%` } }
        />
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm text-white/60">
          <TrendingUp className="h-4 w-4" />
          Pool {Number(formatEther(pool)).toFixed(3)} RITUAL
        </span>
        <a
          href="#markets"
          className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-600"
        >
          Trade now
        </a>
      </div>
    </motion.div>
  );
}
