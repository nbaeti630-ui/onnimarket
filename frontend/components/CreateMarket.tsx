"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Sparkles } from "lucide-react";
import { marketAbi, MARKET_ADDRESS } from "@/lib/contract";

const ASSETS = [
  { label: "Bitcoin (BTC)", value: "bitcoin", short: "Bitcoin" },
  { label: "Ethereum (ETH)", value: "ethereum", short: "Ethereum" },
  { label: "Solana (SOL)", value: "solana", short: "Solana" },
  { label: "BNB", value: "bnb", short: "BNB" },
];

const DURATIONS = [
  { label: "1 hour", sec: 3600 },
  { label: "6 hours", sec: 21600 },
  { label: "1 day", sec: 86400 },
  { label: "3 days", sec: 259200 },
  { label: "1 week", sec: 604800 },
  { label: "30 days", sec: 2592000 },
];

export function CreateMarket() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState("bitcoin");
  const [target, setTarget] = useState("120000");
  const [durationSec, setDurationSec] = useState(86400);
  const [question, setQuestion] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [prepError, setPrepError] = useState("");

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const short = ASSETS.find((a) => a.value === asset)?.short ?? asset;
  const durationLabel = DURATIONS.find((d) => d.sec === durationSec)?.label ?? "1 day";
  const suggested = `Will ${short} be ≥ $${target || "0"} within ${durationLabel}?`;

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => window.location.reload(), 1200);
      return () => clearTimeout(t);
    }
  }, [isSuccess]);

  async function submit() {
    if (!publicClient) return;
    setPrepError("");
    try {
      setPreparing(true);
      const block = await publicClient.getBlock();
      const deadline = block.timestamp + BigInt(durationSec) * 1000n;
      const q = question.trim() || suggested;
      const targetNum = BigInt(Math.max(0, Math.floor(Number(target) || 0)));
      const fees = await publicClient.estimateFeesPerGas();
      writeContract({
        address: MARKET_ADDRESS,
        abi: marketAbi,
        functionName: "createMarket",
        args: [q, asset, targetNum, deadline],
        type: "eip1559",
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
    } catch (e: any) {
      setPrepError(e?.shortMessage || "Could not prepare transaction. Try again.");
    } finally {
      setPreparing(false);
    }
  }

  const busy = preparing || isPending || confirming;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand to-brand-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:opacity-90"
      >
        <Plus size={16} /> Create Market
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={ { opacity: 0 } }
            animate={ { opacity: 1 } }
            exit={ { opacity: 0 } }
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => !busy && setOpen(false)}
          >
            <motion.div
              initial={ { y: 40, opacity: 0 } }
              animate={ { y: 0, opacity: 1 } }
              exit={ { y: 40, opacity: 0 } }
              onClick={(e) => e.stopPropagation()}
              className="glass w-full max-w-lg rounded-t-3xl p-6 sm:rounded-3xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Sparkles size={18} className="text-brand-400" /> Create a market
                </h3>
                <button
                  onClick={() => !busy && setOpen(false)}
                  className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {isSuccess ? (
                <div className="py-10 text-center">
                  <div className="text-4xl">🎉</div>
                  <p className="mt-3 font-medium">Market created!</p>
                  <p className="text-sm text-white/50">Refreshing…</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-wide text-white/50">Asset</span>
                    <select
                      value={asset}
                      onChange={(e) => setAsset(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
                    >
                      {ASSETS.map((a) => (
                        <option key={a.value} value={a.value} className="bg-[#1a0b1e]">
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-wide text-white/50">Target price (USD)</span>
                      <input
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
                        placeholder="120000"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs uppercase tracking-wide text-white/50">Closes in</span>
                      <select
                        value={durationSec}
                        onChange={(e) => setDurationSec(Number(e.target.value))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
                      >
                        {DURATIONS.map((d) => (
                          <option key={d.sec} value={d.sec} className="bg-[#1a0b1e]">
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs uppercase tracking-wide text-white/50">Question</span>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-brand"
                      placeholder={suggested}
                    />
                    <button
                      type="button"
                      onClick={() => setQuestion(suggested)}
                      className="mt-1.5 text-left text-xs text-brand-400 hover:underline"
                    >
                      ✨ Use suggestion: {suggested}
                    </button>
                  </label>

                  {(error || prepError) && (
                    <p className="rounded-lg bg-down/15 px-3 py-2 text-xs text-down">
                      {prepError || (error as any)?.shortMessage || "Transaction failed"}
                    </p>
                  )}

                  <button
                    disabled={!isConnected || busy}
                    onClick={submit}
                    className="w-full rounded-xl bg-gradient-to-r from-brand to-brand-600 py-3 text-sm font-semibold text-white shadow-glow transition hover:opacity-90 disabled:opacity-50"
                  >
                    {!isConnected ? "Connect wallet first" : busy ? "Creating…" : "Create market"}
                  </button>
                  <p className="text-center text-[11px] text-white/40">
                    Resolves YES if {short} ≥ ${target || "0"} after {durationLabel} · on-chain via Ritual TEE
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
