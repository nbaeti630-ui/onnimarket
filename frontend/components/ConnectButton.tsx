"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, type Connector } from "wagmi";
import { Wallet, LogOut } from "lucide-react";

function ConnectButton() {
	const [mounted, setMounted] = useState(false);
	const [open, setOpen] = useState(false);
	useEffect(() => setMounted(true), []);

	const { address, isConnected } = useAccount();
	const { connect, connectors, isPending } = useConnect();
	const { disconnect } = useDisconnect();

	const pick = (c: Connector) => {
		connect({ connector: c });
		setOpen(false);
	};

	if (!mounted) {
		return (
			<button className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-glow">
				<Wallet className="h-4 w-4" />
				Connect Wallet
			</button>
		);
	}

	if (isConnected) {
		return (
			<div className="flex items-center gap-2">
				<span className="glass rounded-xl px-3 py-2 text-sm text-white/90">
					{address?.slice(0, 6)}…{address?.slice(-4)}
				</span>
				<button
					onClick={() => disconnect()}
					className="glass rounded-xl p-2 text-white/70 hover:text-white"
					aria-label="Disconnect"
				>
					<LogOut className="h-4 w-4" />
				</button>
			</div>
		);
	}

	return (
		<div className="relative">
			<button
				onClick={() => setOpen((v) => !v)}
				disabled={isPending}
				className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-glow transition hover:bg-brand-600 disabled:opacity-60"
			>
				<Wallet className="h-4 w-4" />
				{isPending ? "Connecting…" : "Connect Wallet"}
			</button>
			{open && (
				<div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#160a2e] shadow-glow">
					{connectors.map((c) => (
						<button
							key={c.uid}
							onClick={() => pick(c)}
							className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5"
						>
							<Wallet className="h-4 w-4 text-brand-400" />
							{c.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export default ConnectButton;
export { ConnectButton };
