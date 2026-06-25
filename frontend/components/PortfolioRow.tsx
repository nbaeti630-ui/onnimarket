"use client";

import { useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { formatEther } from "viem";
import { motion } from "framer-motion";
import { marketAbi, MARKET_ADDRESS, type MarketView } from "@/lib/contract";
import { celebrate } from "@/lib/celebrate";
import { Coins, Trophy, X, Clock, Check } from "lucide-react";

export function PortfolioRow({
  id,
  address,
  index,
}: {
  id: bigint;
  address: `0x${string}`;
  index: number;
}) {
  const publicClient = usePublicClient();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { data: market } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "getMarket",
    args: [id],
  });
  const { data: yes } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "yesStake",
    args: [id, address],
  });
  const { data: no } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "noStake",
    args: [id, address],
  });
  const { data: didClaim } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "claimed",
    args: [id, address],
  });

  useEffect(() => {
    if (!isSuccess) return;
    const mk = market as unknown as MarketView | undefined;
    if (mk) {
      const ys = (yes as bigint) ?? 0n;
      const ns = (no as bigint) ?? 0n;
      const w = (mk.outcome === 1 && ys > 0n) || (mk.outcome === 2 && ns > 0n);
      if (w) celebrate();
    }
    const t = setTimeout(() => window.location.reload(), 1400);
    return () => clearTimeout(t);
  }, [isSuccess]);

  const yesStake = (yes as bigint) ?? 0n;
  const noStake = (no as bigint) ?? 0n;

  if (!market || (yesStake === 0n && noStake === 0n)) return null;

  const m = market as unknown as MarketView;
  const resolved = m.outcome !== 0;
  const won =
    (m.outcome === 1 && yesStake > 0n) || (m.outcome === 2 && noStake > 0n);

  let payout = 0n;
  if (resolved && won) {
    const winStake = m.outcome === 1 ? yesStake : noStake;
    const winPool = m.outcome === 1 ? m.poolYes : m.poolNo;
    const losePool = m.outcome === 1 ? m.poolNo : m.poolYes;
    payout = winStake + (winPool > 0n ? (winStake * losePool) / winPool : 0n);
  }

  const claimable = resolved && won && !didClaim;
  const busy = isPending || confirming;

  async function doClaim() {
    if (!publicClient) return;
    const fees = await publicClient.estimateFeesPerGas();
    writeContract({
      address: MARKET_ADDRESS,
      abi: marketAbi,
      functionName: "claim",
      args: [id],
      type: "eip1559",
      maxFeePerGas: fees.maxFeePerGas,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
    });
  }

  return (
    <motion.div
      initial={ { opacity: 0, y: 12 } }
      animate={ { opacity: 1, y: 0 } }
      transition={ { delay: index * 0.05 } }
      className="glass rounded-3xl p-5"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-white/70">
          <Coins className="h-3.5 w-3.5 text-brand-400" />
          {m.asset}
        </span>
        {!resolved ? (
          <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-white/60">
            <Clock className="h-3.5 w-3.5" />
            Pending
          </span>
        ) : won ? (
          <span className="flex items-center gap-1 rounded-full bg-up/15 px-2.5 py-1 text-xs font-semibold text-up">
            <Trophy className="h-3.5 w-3.5" />
            Won
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-down/15 px-2.5 py-1 text-xs font-semibold text-down">
            <X className="h-3.5 w-3.5" />
            Lost
          </span>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug text-white">
        {m.question}
      </h3>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {yesStake > 0n && (
          <span className="rounded-lg bg-up/10 px-2.5 py-1 font-medium text-up">
            YES {Number(formatEther(yesStake)).toFixed(3)}
          </span>
        )}
        {noStake > 0n && (
          <span className="rounded-lg bg-down/10 px-2.5 py-1 font-medium text-down">
            NO {Number(formatEther(noStake)).toFixed(3)}
          </span>
        )}
      </div>

      {claimable ? (
        <button
          onClick={doClaim}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-600 disabled:opacity-50"
        >
          <Trophy className="h-4 w-4" />
          {busy ? "Claiming…" : `Claim ${Number(formatEther(payout)).toFixed(3)} RITUAL`}
        </button>
      ) : resolved && won && didClaim ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-sm text-up">
          <Check className="h-4 w-4" />
          Claimed
        </div>
      ) : resolved && !won ? (
        <div className="mt-4 rounded-xl bg-white/5 py-2 text-center text-sm text-white/50">
          Better luck next time
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-white/5 py-2 text-center text-sm text-white/50">
          Waiting for market to resolve
        </div>
      )}

      {isSuccess && (
        <p className="mt-2 text-center text-xs text-up">Claimed! Refreshing…</p>
      )}
    </motion.div>
  );
}
