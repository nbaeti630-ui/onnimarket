"use client";

import { useState, useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { motion } from "framer-motion";
import { marketAbi, MARKET_ADDRESS, type MarketView } from "@/lib/contract";
import { buildFeatures, featuresToInt32 } from "@/lib/ai";
import { TrendingUp, Clock, Coins, Sparkles, Brain } from "lucide-react";

const PRESETS = ["0.01", "0.1", "1"];

function fmtRemaining(sec: number) {
  if (sec <= 0) return "Closed";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

export function MarketCard({ id, index }: { id: bigint; index: number }) {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [amount, setAmount] = useState("0.01");
  const [pendingSide, setPendingSide] = useState<boolean | null>(null);
  const [resolving, setResolving] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [betError, setBetError] = useState("");
  const [chainNowMs, setChainNowMs] = useState<number | null>(null);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

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
  const { data: aiBps } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "aiScoreBps",
    args: [id],
  });
  const { data: aiDone } = useReadContract({
    address: MARKET_ADDRESS,
    abi: marketAbi,
    functionName: "aiScored",
    args: [id],
  });

  useEffect(() => {
    if (!publicClient) return;
    let active = true;
    publicClient
      .getBlock()
      .then((b) => {
        if (active) setChainNowMs(Number(b.timestamp));
      })
      .catch(() => {});
    const iv = setInterval(
      () => setChainNowMs((p) => (p == null ? p : p + 1000)),
      1000,
    );
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [publicClient]);

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => window.location.reload(), 1400);
      return () => clearTimeout(t);
    }
  }, [isSuccess]);

  if (!market) {
    return <div className="glass h-64 animate-pulse rounded-3xl" />;
  }

  const m = market as unknown as MarketView;
  const yesPct = oddsBps ? Number(oddsBps) / 100 : 50;
  const pool = m.poolYes + m.poolNo;
  const resolved = m.outcome !== 0;
  const aiScored = Boolean(aiDone);
  const aiPct = aiBps != null ? Number(aiBps) / 100 : null;
  const remaining =
    chainNowMs == null ? null : Math.floor((Number(m.deadline) - chainNowMs) / 1000);
  const closed = remaining != null && remaining <= 0;
  const busy = isPending || confirming;

  async function placeBet(isYes: boolean) {
    if (!publicClient) return;
    setBetError("");
    setPendingSide(isYes);
    try {
      const fees = await publicClient.estimateFeesPerGas();
      writeContract({
        address: MARKET_ADDRESS,
        abi: marketAbi,
        functionName: "bet",
        args: [id, isYes],
        value: parseEther(amount || "0"),
        type: "eip1559",
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
    } catch (e: any) {
      setBetError(e?.shortMessage || "Bet failed. Try again.");
      setPendingSide(null);
    }
  }

  async function resolveMarket() {
    if (!publicClient) return;
    setBetError("");
    setResolving(true);
    try {
      const asset = m.asset;
      const url =
        "https://api.coingecko.com/api/v3/simple/price?ids=" +
        encodeURIComponent(asset) +
        "&vs_currencies=usd";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Price fetch failed");
      const data = await res.json();
      const usd = data?.[asset]?.usd;
      if (usd == null) throw new Error("No price for " + asset);
      const observed = BigInt(Math.floor(Number(usd)));
      const fees = await publicClient.estimateFeesPerGas();
      writeContract({
        address: MARKET_ADDRESS,
        abi: marketAbi,
        functionName: "resolveManual",
        args: [id, observed],
        type: "eip1559",
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
        gas: 300000n,
      });
    } catch (e: any) {
      setBetError(e?.shortMessage || e?.message || "Resolve failed. Try again.");
      setResolving(false);
    }
  }

  async function runAi() {
    if (!publicClient) return;
    setBetError("");
    setScoring(true);
    try {
      const feats = featuresToInt32(buildFeatures(m));
      const fees = await publicClient.estimateFeesPerGas();
      writeContract({
        address: MARKET_ADDRESS,
        abi: marketAbi,
        functionName: "computeAiScore",
        args: [id, feats],
        type: "eip1559",
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
        gas: 3000000n,
      });
    } catch (e: any) {
      setBetError(e?.shortMessage || e?.message || "AI scoring failed. Try again.");
      setScoring(false);
    }
  }

  return (
    <motion.article
      initial={ { opacity: 0, y: 16 } }
      animate={ { opacity: 1, y: 0 } }
      transition={ { delay: index * 0.05 } }
      className="glass group relative rounded-3xl p-5 transition hover:shadow-glow"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-white/60">
          <Coins className="h-3.5 w-3.5" /> {m.asset}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-white/50">
          <Clock className="h-3.5 w-3.5" />
          {remaining == null ? "…" : fmtRemaining(remaining)}
        </span>
      </div>

      {aiScored && aiPct != null && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-brand/20 bg-brand/10 px-3 py-2">
          <Sparkles className="h-4 w-4 text-brand-400" />
          <span className="text-xs text-white/70">Ritual AI prediction</span>
          <span className="ml-auto text-sm font-semibold text-brand-400">
            {aiPct.toFixed(1)}% YES
          </span>
        </div>
      )}

      <h3 className="mb-4 text-base font-semibold leading-snug text-white">{m.question}</h3>

      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-up">YES {yesPct.toFixed(0)}%</span>
        <span className="font-medium text-down">NO {(100 - yesPct).toFixed(0)}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-up to-up/70"
          initial={ { width: 0 } }
          animate={ { width: `${yesPct}%` } }
          transition={ { duration: 0.6 } }
        />
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-white/50">
        <span className="inline-flex items-center gap-1">
          <TrendingUp className="h-3.5 w-3.5" />
          Pool {Number(formatEther(pool)).toFixed(3)} RITUAL
        </span>
        <span>Target ${m.targetPrice.toString()}</span>
      </div>

      {!aiScored && !resolved && (
        <button
          onClick={runAi}
          disabled={!isConnected || busy}
          className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand/30 py-2 text-xs font-medium text-brand-400 transition hover:bg-brand/10 disabled:opacity-50"
        >
          <Brain className="h-3.5 w-3.5" />
          {busy && scoring ? "Scoring on-chain…" : "Run Ritual AI prediction"}
        </button>
      )}

      {resolved ? (
        <div className="rounded-xl bg-white/5 px-3 py-3 text-center text-sm">
          <span className="text-white/60">Resolved — </span>
          <span className={m.outcome === 1 ? "font-semibold text-up" : "font-semibold text-down"}>
            {m.outcome === 1 ? "YES" : "NO"}
          </span>
          <span className="text-white/60"> @ ${m.resolvedPrice.toString()}</span>
        </div>
      ) : closed ? (
        <div className="space-y-2">
          <p className="text-center text-xs text-white/50">Betting closed · ready to resolve</p>
          <button
            onClick={resolveMarket}
            disabled={!isConnected || busy}
            className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-600 py-2.5 text-sm font-medium text-white shadow-glow transition hover:opacity-90 disabled:opacity-50"
          >
            {busy && resolving ? "Resolving…" : "Resolve market"}
          </button>
          <p className="text-center text-[11px] text-white/40">
            Settles this market against the live market price.
          </p>
          {!isConnected && (
            <p className="text-center text-xs text-white/40">Connect wallet to resolve</p>
          )}
          {betError && <p className="text-center text-xs text-down">{betError}</p>}
          {isSuccess && (
            <p className="rounded-lg bg-up/15 px-3 py-2 text-center text-xs text-up">
              Submitted! Refreshing…
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="col-span-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-brand"
              placeholder="0.01"
            />
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className="rounded-lg border border-white/10 px-2 py-2 text-xs text-white/60 transition hover:border-brand hover:text-brand-400"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => placeBet(true)}
              disabled={!isConnected || busy}
              className="flex-1 rounded-xl bg-up/15 py-2 text-sm font-medium text-up transition hover:bg-up/25 disabled:opacity-50"
            >
              {busy && pendingSide === true ? "Betting…" : "Buy YES"}
            </button>
            <button
              onClick={() => placeBet(false)}
              disabled={!isConnected || busy}
              className="flex-1 rounded-xl bg-down/15 py-2 text-sm font-medium text-down transition hover:bg-down/25 disabled:opacity-50"
            >
              {busy && pendingSide === false ? "Betting…" : "Buy NO"}
            </button>
          </div>
          {!isConnected && (
            <p className="text-center text-xs text-white/40">Connect wallet to bet</p>
          )}
          {betError && <p className="text-center text-xs text-down">{betError}</p>}
          {isSuccess && (
            <p className="rounded-lg bg-up/15 px-3 py-2 text-center text-xs text-up">
              Bet placed! Refreshing…
            </p>
          )}
        </div>
      )}
    </motion.article>
  );
}
