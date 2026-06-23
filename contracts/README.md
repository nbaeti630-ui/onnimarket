# OnniMarket — Contracts (Foundry)

Self-resolving crypto prediction market on **Ritual Chain** (chain id `1979`).

## Setup (Android + VPS)

```bash
curl -L https://foundry.paradigm.xyz | bash && source ~/.bashrc && foundryup
cd contracts
forge install foundry-rs/forge-std
forge build
```

## Deploy

```bash
export PRIVATE_KEY=0xyour_key
# Optional: a registered TEE executor address (needed for resolve())
export EXECUTOR=0x...

forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://rpc.ritualfoundation.org \
  --broadcast
```

Copy the deployed address into `../frontend/.env.local` as `NEXT_PUBLIC_MARKET_ADDRESS`.

## Important notes (read before resolve())

- **Fund RitualWallet first.** Precompile calls cost fees. Deposit RITUAL into
  `RitualWallet` (`0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948`) for the EOA that
  will call `resolve()` BEFORE calling it.
- **One async precompile call per tx.** `resolve()` uses the HTTP precompile;
  don't add a second async call in the same tx.
- **`TODO(ritual)` markers** in `PredictionMarket.sol` must be filled with real
  values: a registered executor, a real price API URL, and the JQ path/encoding.
  Cross-check against https://github.com/ritual-foundation/ritual-dapp-skills
  and https://docs.ritualfoundation.org
