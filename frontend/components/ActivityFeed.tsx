"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS, type MarketView } from "@/lib/contract";
import { CheckCircle2, PlusCircle, Activity } from "lucide-react";

type Item = { kind: "resolved" | "created"; id: bigint; m: MarketView };

export function ActivityFeed() {
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

  const items: Item[] = [];
  markets.forEach((r, i) => {
    const m = r.result as unknown as MarketView | undefined;
    if (!m) return;
    if (m.outcome !== 0) items.push({ kind: "resolved", id: ids[i], m });
    items.push({ kind: "created", id: ids[i], m });
  });
  items.sort((a, b) => {
    if (a.id !== b.id) return a.id > b.id ? -1 : 1;
    return a.kind === "resolved" ? -1 : 1;
  });
  const show = items.slice(0, 7);

  return (
    <div className="glass rounded-3xl p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Activity className="h-4 w-4 text-brand-400" />
        Recent activity
      </div>
      <div className="space-y-3">
        {show.map((it, idx) => (
          <div key={idx} className="flex items-start gap-3">
            {it.kind === "resolved" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-up" />
            ) : (
              <PlusCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm text-white/80">{it.m.question}</p>
              <p className="text-xs text-white/40">
                {it.kind === "resolved"
                  ? `Resolved ${it.m.outcome === 1 ? "YES" : "NO"} @ $${it.m.resolvedPrice.toString()}`
                  : `New market · ${it.m.asset.toUpperCase()} · target $${it.m.targetPrice.toString()}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
