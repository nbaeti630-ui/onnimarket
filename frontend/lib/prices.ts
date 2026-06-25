"use client";

import { useEffect, useState } from "react";

export type PriceInfo = {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
  sparkline: number[];
};

const IDS = ["bitcoin", "ethereum", "solana", "binancecoin"];
const URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" +
  IDS.join(",") +
  "&sparkline=true&price_change_percentage=24h";

let cache: Record<string, PriceInfo> | null = null;
let listeners: Array<() => void> = [];
let timer: ReturnType<typeof setInterval> | null = null;

async function fetchPrices() {
  try {
    const res = await fetch(URL, { headers: { accept: "application/json" } });
    if (!res.ok) return;
    const data = await res.json();
    const next: Record<string, PriceInfo> = {};
    for (const c of data) {
      next[c.id] = {
        id: c.id,
        symbol: String(c.symbol || "").toUpperCase(),
        price: c.current_price || 0,
        change24h: c.price_change_percentage_24h || 0,
        sparkline:
          c.sparkline_in_7d && c.sparkline_in_7d.price
            ? c.sparkline_in_7d.price
            : [],
      };
    }
    cache = next;
    listeners.forEach((l) => l());
  } catch (e) {}
}

function ensureRunning() {
  if (timer) return;
  fetchPrices();
  timer = setInterval(fetchPrices, 60000);
}

export function usePrices() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    listeners.push(l);
    ensureRunning();
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  return cache;
}
