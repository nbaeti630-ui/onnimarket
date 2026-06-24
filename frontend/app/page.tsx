import { MarketGrid } from "@/components/MarketGrid";
import { CreateMarket } from "@/components/CreateMarket";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/60">
          <span className="h-2 w-2 animate-float rounded-full bg-up" />
          Self-resolving · No oracles · Powered by Ritual TEE precompiles
        </div>
        <h1 className="mx-auto max-w-3xl bg-gradient-to-b from-white to-white/50 bg-clip-text text-5xl font-bold leading-tight text-transparent sm:text-6xl">
          Predict crypto.
          <br />
          Markets that settle themselves.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-white/60">
          OnniMarket lets you bet YES/NO on crypto price outcomes. When the deadline hits,
          the smart contract fetches the live price itself — on-chain, inside a TEE — and
          pays out winners automatically.
        </p>
      </section>

      {/* Stats strip */}
      <section className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Chain", "Ritual 1979"],
          ["Resolution", "On-chain TEE"],
          ["Oracles", "Zero"],
          ["Block time", "~350ms"],
        ].map(([label, value]) => (
          <div key={label} className="glass rounded-2xl p-4 text-center">
            <div className="text-xs uppercase tracking-wide text-white/40">{label}</div>
            <div className="mt-1 font-semibold text-brand-400">{value}</div>
          </div>
        ))}
      </section>

      {/* Markets */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Live markets</h2>
          <CreateMarket />
        </div>
        <MarketGrid />
      </section>
    </div>
  );
}
