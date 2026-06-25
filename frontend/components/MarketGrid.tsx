"use client";

import { useMemo, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS, type MarketView } from "@/lib/contract";
import { MarketCard } from "./MarketCard";
import { Search } from "lucide-react";

const ASSET_FILTERS = [
  { id: "all", label: "All" },
  { id: "bitcoin", label: "BTC" },
  { id: "ethereum", label: "ETH" },
  { id: "solana", label: "SOL" },
  { id: "binancecoin", label: "BNB" },
];

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
];

export function MarketGrid() {
  const { data: count } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "marketCount",
  });
  const n = count ? Number(count) : 0;
  const ids = useMemo(
    () => Array.from({ length: n }, (_, i) => BigInt(i + 1)),
    [n]
  );

  const { data: markets, isLoading } = useReadContracts({
    contracts: ids.map((id) => ({
      address: MARKET_ADDRESS,
      abi: marketAbi,
      functionName: "getMarket",
      args: [id],
    })),
    query: { enabled: n > 0 },
  });

  const [q, setQ] = useState("");
  const [asset, setAsset] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    if (!markets) return [] as bigint[];
    return ids
      .map((id, i) => ({ id, m: markets[i]?.result as unknown as MarketView | undefined }))
      .filter((x) => {
        const m = x.m;
        if (!m) return false;
        if (asset !== "all" && m.asset !== asset) return false;
        const resolved = m.outcome !== 0;
        if (status === "open" && resolved) return false;
        if (status === "resolved" && !resolved) return false;
        const term = q.trim().toLowerCase();
        if (term && !m.question.toLowerCase().includes(term)) return false;
        return true;
      })
      .map((x) => x.id)
      .reverse();
  }, [markets, ids, asset, status, q]);

  if (n === 0) {
    return (
      <p className="glass rounded-3xl p-10 text-center text-white/50">
        No markets yet. Be the first to create one!
      </p>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3">
        <div className="glass flex items-center gap-2 rounded-xl px-3 py-2">
          <Search className="h-4 w-4 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search markets…"
            className="w-full bg-transparent text-sm text-white placeholder-white/30 outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ASSET_FILTERS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAsset(a.id)}
              className={
                "rounded-full px-3 py-1 text-xs transition " +
                (asset === a.id
                  ? "bg-brand text-white"
                  : "glass text-white/60 hover:text-white")
              }
            >
              {a.label}
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-white/15" />
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatus(s.id)}
              className={
                "rounded-full px-3 py-1 text-xs transition " +
                (status === s.id
                  ? "bg-brand text-white"
                  : "glass text-white/60 hover:text-white")
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !markets ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass h-64 animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="glass rounded-3xl p-10 text-center text-white/50">
          No markets match your filters.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((id) => (
            <MarketCard key={id.toString()} id={id} />
          ))}
        </div>
      )}
    </div>
  );
}
