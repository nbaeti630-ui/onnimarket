import { Leaderboard } from "@/components/Leaderboard";

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="mt-1 text-sm text-white/50">Markets ranked by total volume staked.</p>
      </div>
      <Leaderboard />
    </div>
  );
}
