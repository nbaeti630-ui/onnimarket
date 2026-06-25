import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "OnniMarket — Self-Resolving Crypto Prediction Markets",
  description: "Bet on crypto price outcomes. Markets resolve themselves on-chain via Ritual TEE precompiles. No oracles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen">
        <div className="aurora" />
        <div className="ritual-wrap" aria-hidden="true">
          <svg className="ritual-logo" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" fill="#ffffff" stroke="#140711" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" d="M 200.0,329.2 L 170.5,359.9 L 201.2,390.6 L 231.9,359.9 Z M 303.8,289.1 L 266.1,250.1 L 249.6,267.8 L 269.6,290.3 L 243.7,315.0 L 179.9,251.3 L 162.2,266.7 L 243.7,349.3 Z M 267.3,207.7 L 205.9,266.7 L 222.4,283.2 L 281.4,224.2 Z M 179.9,207.7 L 97.3,287.9 L 157.5,349.3 L 194.1,310.3 L 178.8,293.8 L 156.3,315.0 L 131.6,287.9 L 195.3,223.0 Z M 178.8,162.8 L 162.2,179.4 L 222.4,239.5 L 238.9,223.0 Z M 332.2,141.6 L 293.2,178.2 L 309.7,195.9 L 331.0,174.6 L 356.9,200.6 L 331.0,227.7 L 266.1,162.8 L 249.6,179.4 L 331.0,261.9 L 390.0,202.9 L 390.0,199.4 Z M 71.4,141.6 L 69.0,141.6 L 10.0,201.8 L 70.2,261.9 L 108.0,224.2 L 91.4,206.5 L 70.2,227.7 L 44.2,201.8 L 70.2,174.6 L 135.1,239.5 L 151.6,223.0 Z M 178.8,119.2 L 119.8,178.2 L 135.1,195.9 L 195.3,135.7 Z M 243.7,53.1 L 205.9,92.0 L 223.6,107.4 L 244.8,87.3 L 269.6,114.5 L 205.9,179.4 L 222.4,195.9 L 303.8,114.5 Z M 97.3,113.3 L 135.1,152.2 L 151.6,134.5 L 131.6,112.1 L 157.5,87.3 L 222.4,152.2 L 238.9,135.7 L 157.5,53.1 Z M 201.2,9.4 L 170.5,40.1 L 200.0,70.8 L 231.9,40.1 Z" />
          </svg>
        </div>
        <div className="grid-overlay" />
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 pb-24">{children}</main>
        </Providers>
        <Footer />
  </body>
    </html>
  );
}
