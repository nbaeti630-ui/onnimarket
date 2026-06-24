export const MARKET_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_ADDRESS ||
  "0xe381C15d88160b3fC4493723C7481Ac4B8C8f5Dd") as `0x${string}`;

export const RITUAL_WALLET_ADDRESS =
  "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948" as `0x${string}`;

export const marketAbi = [
  { type: "function", name: "marketCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "ritualBalance", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function", name: "getMarket", stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "tuple", components: [
      { name: "question", type: "string" },
      { name: "asset", type: "string" },
      { name: "targetPrice", type: "uint256" },
      { name: "deadline", type: "uint64" },
      { name: "poolYes", type: "uint256" },
      { name: "poolNo", type: "uint256" },
      { name: "outcome", type: "uint8" },
      { name: "resolvedPrice", type: "uint256" },
      { name: "creator", type: "address" },
      { name: "exists", type: "bool" },
    ]}],
  },
  { type: "function", name: "yesOddsBps", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "aiScoreBps", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "aiScored", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "yesStake", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "noStake", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "claimed", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ type: "bool" }] },
  {
    type: "function", name: "createMarket", stateMutability: "nonpayable",
    inputs: [
      { name: "question", type: "string" },
      { name: "asset", type: "string" },
      { name: "targetPrice", type: "uint256" },
      { name: "deadline", type: "uint64" },
    ],
    outputs: [{ type: "uint256" }],
  },
  { type: "function", name: "bet", stateMutability: "payable", inputs: [{ name: "id", type: "uint256" }, { name: "isYes", type: "bool" }], outputs: [] },
  { type: "function", name: "resolve", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
  { type: "function", name: "resolveManual", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }, { name: "observedPrice", type: "uint256" }], outputs: [] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }], outputs: [] },
  { type: "function", name: "depositForFees", stateMutability: "payable", inputs: [{ name: "lockBlocks", type: "uint256" }], outputs: [] },
  { type: "function", name: "computeAiScore", stateMutability: "nonpayable", inputs: [{ name: "id", type: "uint256" }, { name: "features", type: "int32[]" }], outputs: [{ type: "uint256" }] },
] as const;

export type MarketView = {
  question: string;
  asset: string;
  targetPrice: bigint;
  deadline: bigint;
  poolYes: bigint;
  poolNo: bigint;
  outcome: number;
  resolvedPrice: bigint;
  creator: `0x${string}`;
  exists: boolean;
};

export type AssetOption = { id: string; label: string };
export const ASSETS: AssetOption[] = [
  { id: "bitcoin", label: "BTC" },
  { id: "ethereum", label: "ETH" },
  { id: "solana", label: "SOL" },
  { id: "binancecoin", label: "BNB" },
];

export const OUTCOME_LABEL = ["Unresolved", "YES", "NO"] as const;
