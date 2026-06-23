"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { formatEther, parseEther } from "viem";
import { motion } from "framer-motion";
import { marketAbi, MARKET_ADDRESS, type MarketView } from "@/lib/contract";
import { TrendingUp, Clock, Coins } from "lucide-react";

function Countdown({ deadline }: { deadline: bigint }) {
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(deadline) - now;
  if (diff <= 0) return <span className="text-down">Closed</span>;
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return <span>{d > 0 ? `${d}d ` : ""}{h}h {m}m</span>;
}

export function MarketCard({ id, index }: { id: bigint; index: number }) {
  const { isConnected } = useAccount();
  const [amount, setAmount] = useState("0.01");
  const { writeContract, isPending } = useWriteContract();

  const { data: market } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "getMarket",
    args: [id],
  });
  const { data: oddsBps } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "yesOddsBps",
    args: [id],
  });

  if (!market) {
    return <div className="skeleton h-56 rounded-3xl" />;
  }

  const m = market as unknown as MarketView;
  const yesPct = oddsBps ? Number(oddsBps) / 100 : 50;
  const pool = m.poolYes + m.poolNo;
  const resolved = m.outcome !== 0;

  function placeBet(isYes: boolean) {
    writeContract({
      address: MARKET_ADDRESS,
      abi: marketAbi,
      functionName: "bet",
      args: [id, isYes],
      value: parseEther(amount || "0"),
    });
  }

  return (
    <motion.article
      initial={ { opacity: 0, y: 16 } } 
      animate={ { opacity: 1, y: 0 } } 
      transition={ { delay: index * 0.05 } } 
      className="glass group relative rounded-3xl p-5 transition hover:shadow-glow"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-white/50">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 uppercase tracking-wide">
          <Coins size={12} /> {m.asset}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={12} /> <Countdown deadline={m.deadline} />
        </span>
      </div>

      <h3 className="mb-4 text-base font-semibold leading-snug">{m.question}</h3>

      {/* odds bar */}
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-up">YES {yesPct.toFixed(0)}%</span>
        <span className="text-down">NO {(100 - yesPct).toFixed(0)}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full bg-gradient-to-r from-up to-up/70" style={{ width: `${yesPct}%` }} />
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-white/50">
        <span className="inline-flex items-center gap-1"><TrendingUp size={12} /> Pool {Number(formatEther(pool)).toFixed(3)} RITUAL</span>
        <span>Target ${m.targetPrice.toString()}</span>
      </div>

      {resolved ? (
        <div className="rounded-xl bg-white/5 py-2 text-center text-sm">
          Resolved — <span className={m.outcome === 1 ? "text-up" : "text-down"}>{m.outcome === 1 ? "YES" : "NO"}</span>
          {" "}@ ${m.resolvedPrice.toString()}
        </div>
      ) : (
        <div className="space-y-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Amount (RITUAL)"
          />
          <div className="flex gap-2">
            <button
              disabled={!isConnected || isPending}
              onClick={() => placeBet(true)}
              className="flex-1 rounded-xl bg-up/15 py-2 text-sm font-medium text-up transition hover:bg-up/25 disabled:opacity-50"
            >
              Buy YES
            </button>
            <button
              disabled={!isConnected || isPending}
              onClick={() => placeBet(false)}
              className="flex-1 rounded-xl bg-down/15 py-2 text-sm font-medium text-down transition hover:bg-down/25 disabled:opacity-50"
            >
              Buy NO
            </button>
          </div>
        </div>
      )}
    </motion.article>
  );
}
