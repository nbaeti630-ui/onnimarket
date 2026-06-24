import type { MarketView } from "./contract";

// Reinterpret a JS float as its IEEE-754 single-precision bit pattern,
// returned as a signed int32 — exactly what Ritual's ONNX precompile expects.
export function floatToInt32(f: number): number {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setFloat32(0, f, false);
  return dv.getInt32(0, false);
}

// Deterministic 10-feature vector derived from on-chain market data.
// Feeds hf/Ritual-Net/sample_linreg/linreg_10_features.onnx inside the TEE.
export function buildFeatures(m: MarketView): number[] {
  const yes = Number(m.poolYes);
  const no = Number(m.poolNo);
  const total = yes + no;
  const yesRatio = total > 0 ? yes / total : 0.5;
  const poolEth = total / 1e18;
  const secondsLeft = Number(m.deadline) / 1000 - Date.now() / 1000;
  const daysLeft = Math.max(0, secondsLeft / 86400);
  const target = Number(m.targetPrice);
  const logTarget = target > 0 ? Math.log10(target) : 0;
  return [
    yesRatio,
    1 - yesRatio,
    Math.log10(1 + poolEth),
    Math.min(1, daysLeft / 30),
    logTarget / 6,
    Math.min(1, poolEth),
    total > 0 ? 1 : 0,
    Math.tanh(yes / 1e18),
    Math.tanh(no / 1e18),
    yesRatio * (1 - yesRatio) * 4,
  ];
}

export function featuresToInt32(features: number[]): number[] {
  return features.map(floatToInt32);
}
