# OnniMarket — Frontend (Next.js + wagmi + Tailwind)

Polished UI for the self-resolving crypto prediction market on Ritual Chain.

## Run (Android + VPS)

```bash
cd frontend
npm install
cp .env.example .env.local   # then paste your deployed contract address
npm run dev                  # http://localhost:3000
```

Deploy to Vercel for a public demo link (set NEXT_PUBLIC_MARKET_ADDRESS in env vars).

## What's inside

- `app/` — App Router pages, animated aurora background, glassmorphism theme.
- `components/MarketCard.tsx` — live odds bar, countdown, Buy YES/NO.
- `components/MarketGrid.tsx` — reads `marketCount` and renders all markets.
- `lib/chain.ts` — Ritual Chain (1979) viem config.
- `lib/contract.ts` — contract ABI + address from env.

## Wallet

Uses injected connector (MetaMask). Add Ritual Chain to MetaMask:
- RPC: https://rpc.ritualfoundation.org
- Chain ID: 1979
- Symbol: RITUAL
- Explorer: https://explorer.ritualfoundation.org
