import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "OnniMarket — Self-Resolving Crypto Prediction Markets",
  description: "Bet on crypto price outcomes. Markets resolve themselves on-chain via Ritual TEE precompiles. No oracles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen">
        <div className="aurora" />
        <div className="grid-overlay" />
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 pb-24">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
