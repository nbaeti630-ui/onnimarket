"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { ritualChain } from "@/lib/chain";
import { Wallet, LogOut } from "lucide-react";

function shorten(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "";
}

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (isConnected) {
    const wrongChain = chainId !== ritualChain.id;
    return (
      <div className="flex items-center gap-2">
        {wrongChain && (
          <button
            onClick={() => switchChain({ chainId: ritualChain.id })}
            className="rounded-xl bg-down/20 px-3 py-2 text-sm text-down hover:bg-down/30"
          >
            Switch to Ritual
          </button>
        )}
        <span className="glass rounded-xl px-3 py-2 text-sm">{shorten(address)}</span>
        <button
          onClick={() => disconnect()}
          className="glass rounded-xl p-2 text-white/70 hover:text-white"
          aria-label="Disconnect"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  const injectedConnector = connectors[0];
  return (
    <button
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={isPending}
      className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:bg-brand-600 disabled:opacity-60"
    >
      <Wallet size={16} />
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
