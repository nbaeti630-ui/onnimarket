"use client";

import { useEffect, useRef, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { marketAbi, MARKET_ADDRESS, type MarketView } from "@/lib/contract";
import { formatEther } from "viem";

function useCountUp(target: number, ms = 900) {
  const [val, setVal] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const from = ref.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else ref.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

export function LiveStats() {
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

  let volume = 0;
  let resolved = 0;
  if (markets) {
    for (const r of markets) {
      const m = r.result as unknown as MarketView | undefined;
      if (!m) continue;
      volume += Number(formatEther(m.poolYes + m.poolNo));
      if (m.outcome !== 0) resolved += 1;
    }
  }

  const vAnim = useCountUp(volume);
  const mAnim = useCountUp(n);
  const rAnim = useCountUp(resolved);

  const items = [
    { label: "Total volume", value: vAnim.toFixed(3) + " RITUAL" },
    { label: "Markets", value: Math.round(mAnim).toString() },
    { label: "Resolved", value: Math.round(rAnim).toString() },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.label} className="glass rounded-2xl px-4 py-3 text-center">
          <p className="text-lg font-bold text-brand-400">{it.value}</p>
          <p className="text-[11px] uppercase tracking-wide text-white/40">{it.label}</p>
        </div>
      ))}
    </div>
  );
}
