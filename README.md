# OnniMarket

Self-resolving **crypto prediction market** built on **Ritual Chain** (chain id `1979`).
Bet YES/NO on a crypto price threshold; the contract resolves itself by fetching the
live price on-chain via Ritual's HTTP precompile inside a TEE — no external oracle.

```
onnimarket/
├─ contracts/   # Foundry: PredictionMarket.sol + HTTP-precompile resolve
└─ frontend/    # Next.js + wagmi + Tailwind, animated glassmorphism UI
```

## Quick path (Android + VPS)

1. **Contracts**
   ```bash
   cd contracts && forge install foundry-rs/forge-std && forge build
   export PRIVATE_KEY=0x...
   forge script script/Deploy.s.sol:Deploy --rpc-url https://rpc.ritualfoundation.org --broadcast
   ```
2. **Frontend**
   ```bash
   cd ../frontend && npm install
   cp .env.example .env.local   # paste deployed address
   npm run dev
   ```
3. Get testnet RITUAL from https://faucet.ritualfoundation.org

## MVP status & TODOs

- [x] Markets, betting, pro-rata payout, odds, countdown UI
- [x] Ritual Chain wiring (viem/wagmi), animated UI
- [ ] Fill `TODO(ritual)` in `PredictionMarket.sol`: registered executor address,
      real price API URL, exact JQ extraction encoding
- [ ] Fund RitualWallet (0x532F…3948) for the EOA calling `resolve()`
- [ ] Add a Create-Market form + Portfolio/Claim page (next iteration)

Docs: https://docs.ritualfoundation.org · Skills: https://github.com/ritual-foundation/ritual-dapp-skills
