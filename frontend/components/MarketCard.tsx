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
import { motion, AnimatePresence } from "framer-motion";
import { marketAbi, MARKET_ADDRESS, type MarketView } from "@/lib/contract";
import { TrendingUp, Clock, Coins, Check, Sparkles } from "lucide-react";

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
  const [pendingSide, setPendingSide] = useState<null | boolean>(null);
  const [resolving, setResolving] = useState(false);
  const [betError, setBetError] = useState("");
  // Ritual block.timestamp is in MILLISECONDS, so track the chain clock in ms.
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

  // Ritual block.timestamp != wall clock (and is in ms), so read the live chain clock.
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
    return <div className="skeleton h-56 rounded-3xl" />;
  }

  const m = market as unknown as MarketView;
  const yesPct = oddsBps ? Number(oddsBps) / 100 : 50;
  const pool = m.poolYes + m.poolNo;
  const resolved = m.outcome !== 0;
  // deadline & chain clock are in ms; show remaining in seconds.
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
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
          asset,
        )}&vs_currencies=usd`,
      );
      if (!res.ok) throw new Error("Price fetch failed");
      const data = await res.json();
      const usd = data?.[asset]?.usd;
      if (usd == null) throw new Error(`No price for ${asset}`);
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
          <Clock size={12} />{" "}
          <span className={closed ? "text-down" : ""}>
            {remaining == null ? "…" : fmtRemaining(remaining)}
          </span>
        </span>
      </div>

      <h3 className="mb-4 text-base font-semibold leading-snug">{m.question}</h3>

      <div className="mb-1 flex justify-between text-xs">
        <span className="text-up">YES {yesPct.toFixed(0)}%</span>
        <span className="text-down">NO {(100 - yesPct).toFixed(0)}%</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-up to-up/70"
          initial={ { width: 0 } }
          animate={ { width: `${yesPct}%` } }
          transition={ { duration: 0.6 } }
        />
      </div>

      <div className="mb-4 flex items-center justify-between text-xs text-white/50">
        <span className="inline-flex items-center gap-1">
          <TrendingUp size={12} /> Pool {Number(formatEther(pool)).toFixed(3)} RITUAL
        </span>
        <span>Target ${m.targetPrice.toString()}</span>
      </div>

      {resolved ? (
        <div className="rounded-xl bg-white/5 py-2 text-center text-sm">
          Resolved —{" "}
          <span className={m.outcome === 1 ? "text-up" : "text-down"}>
            {m.outcome === 1 ? "YES" : "NO"}
          </span>{" "}
          @ ${m.resolvedPrice.toString()}
        </div>
      ) : closed ? (
        <div className="space-y-2">
          <div className="rounded-xl bg-white/5 py-2 text-center text-sm text-white/60">
            Betting closed · ready to resolve
          </div>
          <button
            disabled={!isConnected || busy}
            onClick={resolveMarket}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand/20 py-2 text-sm font-medium text-brand-400 transition hover:bg-brand/30 disabled:opacity-50"
          >
            <Sparkles size={14} />
            {busy && resolving ? "Resolving…" : "Resolve market"}
          </button>
          <p className="text-center text-[11px] text-white/40">
            Settles this market against the live market price.
          </p>
          {!isConnected && (
            <p className="text-center text-[11px] text-white/40">Connect wallet to resolve</p>
          )}
          {betError && (
            <p className="rounded-lg bg-down/15 px-3 py-2 text-xs text-down">{betError}</p>
          )}
          <AnimatePresence>
            {isSuccess && (
              <motion.p
                initial={ { opacity: 0, y: 6 } }
                animate={ { opacity: 1, y: 0 } }
                className="flex items-center justify-center gap-1 rounded-lg bg-up/15 px-3 py-2 text-xs text-up"
              >
                <Check size={13} /> Resolve submitted! Refreshing…
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-brand"
              placeholder="Amount (RITUAL)"
            />
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setAmount(p)}
                className="rounded-lg border border-white/10 px-2 py-2 text-xs text-white/60 transition hover:border-brand hover:text-brand-400"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              disabled={!isConnected || busy}
              onClick={() => placeBet(true)}
              className="flex-1 rounded-xl bg-up/15 py-2 text-sm font-medium text-up transition hover:bg-up/25 disabled:opacity-50"
            >
              {busy && pendingSide === true ? "Betting…" : "Buy YES"}
            </button>
            <button
              disabled={!isConnected || busy}
              onClick={() => placeBet(false)}
              className="flex-1 rounded-xl bg-down/15 py-2 text-sm font-medium text-down transition hover:bg-down/25 disabled:opacity-50"
            >
              {busy && pendingSide === false ? "Betting…" : "Buy NO"}
            </button>
          </div>
          {!isConnected && (
            <p className="text-center text-[11px] text-white/40">Connect wallet to bet</p>
          )}
          {betError && (
            <p className="rounded-lg bg-down/15 px-3 py-2 text-xs text-down">{betError}</p>
          )}
          <AnimatePresence>
            {isSuccess && (
              <motion.p
                initial={ { opacity: 0, y: 6 } }
                animate={ { opacity: 1, y: 0 } }
                className="flex items-center justify-center gap-1 rounded-lg bg-up/15 px-3 py-2 text-xs text-up"
              >
                <Check size={13} /> Bet placed! Refreshing…
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.article>
  );
}
