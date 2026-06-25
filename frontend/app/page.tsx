import Link from "next/link";
import { CreateMarket } from "@/components/CreateMarket";
import { MarketGrid } from "@/components/MarketGrid";
import { PriceTicker } from "@/components/PriceTicker";
import { LiveStats } from "@/components/LiveStats";
import { FeaturedMarket } from "@/components/FeaturedMarket";
import { ActivityFeed } from "@/components/ActivityFeed";

const STATS = [
  { label: "Chain", value: "Ritual 1979" },
  { label: "Resolution", value: "On-chain TEE" },
  { label: "Oracles", value: "Zero" },
  { label: "Block time", value: "~350ms" },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="pt-12 pb-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-up" />
          Self-resolving · No oracles · Powered by Ritual TEE precompiles
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-tight text-white sm:text-6xl">
          Predict crypto.{" "}
          <span className="bg-gradient-to-r from-brand-400 to-brand bg-clip-text text-transparent">
            Markets that settle themselves.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-white/60">
          OnniMarket lets you bet YES/NO on crypto price outcomes. When the deadline hits, the smart contract fetches the live price itself — on-chain, inside a TEE — and pays out winners automatically.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#markets"
            className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-600"
          >
            Start predicting
          </a>
          <Link
            href="/how-it-works"
            className="glass rounded-xl px-6 py-3 text-sm font-semibold text-white/80 transition hover:text-white"
          >
            How it works
          </Link>
        </div>
        <div className="mt-10">
          <PriceTicker />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="glass rounded-2xl px-4 py-4 text-center">
            <p className="text-[11px] uppercase tracking-wide text-white/40">{s.label}</p>
            <p className="mt-1 text-base font-semibold text-brand-400">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6">
        <LiveStats />
      </section>

      <section className="mt-10">
        <FeaturedMarket />
      </section>

      <section id="markets" className="mt-12 pb-20">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Live markets</h2>
          <CreateMarket />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketGrid />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>
      </section>
    </div>
  );
}
