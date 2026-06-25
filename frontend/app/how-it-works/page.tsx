import {
  Coins,
  TrendingUp,
  ShieldCheck,
  Trophy,
  Cpu,
  Globe,
  Sparkles,
} from "lucide-react";

const STEPS = [
  {
    icon: Coins,
    title: "Pick or create a market",
    body: "Browse YES/NO markets on crypto price outcomes — or spin up your own with a target price and a deadline. Anyone can create a market.",
  },
  {
    icon: TrendingUp,
    title: "Place your bet",
    body: "Stake RITUAL on YES or NO. Live odds update from the on-chain pool as people trade.",
  },
  {
    icon: ShieldCheck,
    title: "Markets resolve themselves",
    body: "At the deadline, the smart contract fetches the real market price itself through Ritual's TEE HTTP precompile. No oracle, no admin, no trust required.",
  },
  {
    icon: Trophy,
    title: "Claim your winnings",
    body: "Winners split the entire pool proportionally to their stake. Claim straight from your Portfolio in one click.",
  },
];

const PILLARS = [
  {
    icon: Cpu,
    title: "Native AI Execution",
    body: "ONNX models run on-chain inside a Trusted Execution Environment. OnniMarket uses it to compute an AI probability score for every market — verifiable and tamper-proof.",
  },
  {
    icon: Globe,
    title: "Internet Access",
    body: "Smart contracts make real HTTPS calls from inside a TEE, so markets read live prices straight from the open web — trustlessly, without a centralized oracle.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-xs text-white/60">
          <Sparkles className="h-3.5 w-3.5 text-brand-400" />
          How it works
        </span>
        <h1 className="mt-4 text-3xl font-bold text-white">
          Prediction markets that settle themselves
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/55">
          OnniMarket runs entirely on Ritual Chain. Markets read live prices and run AI on-chain — so no one has to be trusted to resolve them.
        </p>
      </div>

      <div className="space-y-4">
        {STEPS.map((s, i) => (
          <div key={i} className="glass flex gap-4 rounded-2xl p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand-400">
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-1 text-sm text-white/55">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mb-4 mt-12 text-xl font-bold text-white">Powered by Ritual</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {PILLARS.map((p, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-600 text-white">
              <p.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3 text-base font-semibold text-white">{p.title}</h3>
            <p className="mt-1 text-sm text-white/55">{p.body}</p>
          </div>
        ))}
      </div>

      <div className="glass mt-10 rounded-2xl border border-brand/20 p-5 text-center">
        <p className="text-sm text-white/70">
          Built on Ritual Chain · resolved on-chain · Testnet demo
        </p>
      </div>
    </div>
  );
}
