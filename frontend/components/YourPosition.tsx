"use client";

import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { marketAbi, MARKET_ADDRESS } from "@/lib/contract";

export function YourPosition({ id }: { id: bigint }) {
	const { address, isConnected } = useAccount();
	const { data: yes } = useReadContract({
		address: MARKET_ADDRESS,
		abi: marketAbi,
		functionName: "yesStake",
		args: [id, address as `0x${string}`],
		query: { enabled: isConnected && !!address },
	});
	const { data: no } = useReadContract({
		address: MARKET_ADDRESS,
		abi: marketAbi,
		functionName: "noStake",
		args: [id, address as `0x${string}`],
		query: { enabled: isConnected && !!address },
	});

	const yesStake = (yes as bigint) ?? 0n;
	const noStake = (no as bigint) ?? 0n;
	if (!isConnected || (yesStake === 0n && noStake === 0n)) return null;

	const parts: string[] = [];
	if (yesStake > 0n) parts.push(`YES ${Number(formatEther(yesStake)).toFixed(3)}`);
	if (noStake > 0n) parts.push(`NO ${Number(formatEther(noStake)).toFixed(3)}`);

	return (
		<div className="mt-3 flex items-center justify-between rounded-xl border border-brand/40 bg-brand/10 px-3 py-2 text-xs">
			<span className="text-white/70">Your position</span>
			<span className="font-medium text-brand-400">{parts.join(" · ")} RITUAL</span>
		</div>
	);
}
