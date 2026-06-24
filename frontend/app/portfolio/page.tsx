import { Portfolio } from "@/components/Portfolio";

export default function PortfolioPage() {
  return (
    <div>
      <section className="py-12">
        <h1 className="text-3xl font-bold sm:text-4xl">Your Portfolio</h1>
        <p className="mt-2 text-white/60">
          Track your YES/NO positions and claim winnings from resolved markets.
        </p>
      </section>
      <Portfolio />
    </div>
  );
}
