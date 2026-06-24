"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { Sparkles } from "lucide-react";

const NAV = [
  { href: "/", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 mb-8 border-b border-white/5 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-glow">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Onni<span className="text-brand-400">Market</span>
            </span>
          </Link>
          <span className="ml-1 hidden rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50 sm:inline">
            Ritual Chain
          </span>
          <nav className="ml-1 flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    active ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
