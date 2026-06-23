export const MARKET_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Minimal ABI matching contracts/src/PredictionMarket.sol
export const marketAbi = [
  {
    type: "function",
    name: "marketCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getMarket",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
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
        ],
      },
    ],
  },
  {
    type: "function",
    name: "yesOddsBps",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "createMarket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "question", type: "string" },
      { name: "asset", type: "string" },
      { name: "targetPrice", type: "uint256" },
      { name: "deadline", type: "uint64" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "bet",
    stateMutability: "payable",
    inputs: [
      { name: "id", type: "uint256" },
      { name: "isYes", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "resolve",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [],
  },
] as const;

export type MarketView = {
  question: string;
  asset: string;
  targetPrice: bigint;
  deadline: bigint;
  poolYes: bigint;
  poolNo: bigint;
  outcome: number; // 0 Unresolved, 1 Yes, 2 No
  resolvedPrice: bigint;
  creator: `0x${string}`;
  exists: boolean;
};
