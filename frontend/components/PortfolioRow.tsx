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
    if (isSuccess) {
      const t = setTimeout(() => window.location.reload(), 1400);
      return () => clearTimeout(t);
    }
  }, [isSuccess]);

  const yesStake = (yes as bigint) ?? 0n;
  const noStake = (no as bigint) ?? 0n;

  // Hide markets where the user has no position.
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
      <div className="mb-3 flex items-center justify-between text-xs text-white/50">
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 uppercase tracking-wide">
          <Coins size={12} /> {m.asset}
        </span>
        {!resolved ? (
          <span className="inline-flex items-center gap-1 text-white/50">
            <Clock size={12} /> Pending
          </span>
        ) : won ? (
          <span className="inline-flex items-center gap-1 text-up">
            <Trophy size={12} /> Won
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-down">
            <X size={12} /> Lost
          </span>
        )}
      </div>

      <h3 className="mb-3 text-base font-semibold leading-snug">{m.question}</h3>

      <div className="mb-4 flex gap-2 text-xs">
        {yesStake > 0n && (
          <span className="rounded-lg bg-up/15 px-2 py-1 text-up">
            YES {Number(formatEther(yesStake)).toFixed(3)}
          </span>
        )}
        {noStake > 0n && (
          <span className="rounded-lg bg-down/15 px-2 py-1 text-down">
            NO {Number(formatEther(noStake)).toFixed(3)}
          </span>
        )}
      </div>

      {claimable ? (
        <button
          onClick={doClaim}
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-600 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Claiming…" : `Claim ${Number(formatEther(payout)).toFixed(3)} RITUAL`}
        </button>
      ) : resolved && won && didClaim ? (
        <div className="flex items-center justify-center gap-1 rounded-xl bg-up/15 py-2.5 text-sm text-up">
          <Check size={14} /> Claimed
        </div>
      ) : resolved && !won ? (
        <div className="rounded-xl bg-white/5 py-2.5 text-center text-sm text-white/50">
          Better luck next time
        </div>
      ) : (
        <div className="rounded-xl bg-white/5 py-2.5 text-center text-sm text-white/50">
          Waiting for market to resolve
        </div>
      )}

      {isSuccess && (
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-up">
          <Check size={13} /> Claimed! Refreshing…
        </p>
      )}
    </motion.div>
  );
}
