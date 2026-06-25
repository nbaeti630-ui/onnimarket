import Link from "next/link";

const DISCORD_URL = "https://discord.gg/ritual";

export function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="OnniMarket" className="h-8 w-8 rounded-xl" />
              <span className="text-lg font-semibold">
                Onni<span className="text-brand-400">Market</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-white/50">
              Self-resolving crypto prediction markets. On-chain AI and live prices inside a TEE — no oracles.
            </p>
            <p className="mt-3 text-xs text-white/40">Built on Ritual Chain · ID 1979</p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Product</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/" className="hover:text-brand-400">Markets</Link></li>
              <li><Link href="/portfolio" className="hover:text-brand-400">Portfolio</Link></li>
              <li><Link href="/leaderboard" className="hover:text-brand-400">Leaderboard</Link></li>
              <li><Link href="/how-it-works" className="hover:text-brand-400">How it works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Ritual</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="https://ritualfoundation.org" target="_blank" rel="noreferrer" className="hover:text-brand-400">Website</a></li>
              <li><a href="https://docs.ritualfoundation.org" target="_blank" rel="noreferrer" className="hover:text-brand-400">Docs</a></li>
              <li><a href="https://github.com/ritual-foundation" target="_blank" rel="noreferrer" className="hover:text-brand-400">GitHub</a></li>
              <li><a href="https://x.com/ritualfnd" target="_blank" rel="noreferrer" className="hover:text-brand-400">X (Twitter)</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">Community</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href={DISCORD_URL} target="_blank" rel="noreferrer" className="hover:text-brand-400">Discord</a></li>
              <li><a href="mailto:hello@ritualfoundation.org" className="hover:text-brand-400">Email</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© 2026 OnniMarket. Testnet demo — not financial advice.</p>
          <p>Powered by Ritual TEE precompiles</p>
        </div>
      </div>
    </footer>
  );
}
