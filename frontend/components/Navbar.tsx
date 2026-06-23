"use client";

import { ConnectButton } from "./ConnectButton";
import { Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 mb-8 border-b border-white/5 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Onni<span className="text-brand-400">Market</span>
          </span>
          <span className="ml-2 hidden rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50 sm:inline">
            Ritual Chain
          </span>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
}
