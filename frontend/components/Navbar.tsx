"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { Sparkles } from "lucide-react";

const NAV = [
  { href: "/", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/how-it-works", label: "How it works" },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-600 shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="text-base font-semibold">
            Onni<span className="text-brand-400">Market</span>
          </span>
          <span className="hidden rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50 sm:inline">
            Ritual Chain
          </span>
        </Link>
        <ConnectButton />
      </div>
      <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 pb-2">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition " +
                (active
                  ? "bg-brand/15 text-brand-400"
                  : "text-white/60 hover:bg-white/5 hover:text-white")
              }
            >
              {item.label}
            </Link>
          );
        })}
        <a
          href="https://docs.ritualfoundation.org"
          target="_blank"
          rel="noreferrer"
          className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          Docs ↗
        </a>
      </nav>
    </header>
  );
}
