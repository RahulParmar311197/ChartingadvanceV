import { runBacktest, compareToBenchmark } from "../../../packages/strategy-engine/src/index.ts";

const STRATEGIES = new Set(["buy-and-hold", "candle-direction"]);
const INTERVALS = new Set(["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"]);

function validateRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("JSON object is required");
  if (typeof input.strategy !== "string" || !STRATEGIES.has(input.strategy)) throw new Error("unsupported strategy");
  if (!Array.isArray(input.candles) || input.candles.length < 1 || input.candles.length > 20_000) throw new Error("candles must contain 1 to 20000 bars");
  if (input.interval != null && (typeof input.interval !== "string" || !INTERVALS.has(input.interval))) throw new Error("unsupported interval");
  if (input.initialCash != null && (!Number.isFinite(Number(input.initialCash)) || Number(input.initialCash) < 0)) throw new Error("initialCash must be non-negative");
  return {
    strategy: input.strategy,
    candles: input.candles,
    benchmarkCandles: Array.isArray(input.benchmarkCandles) ? input.benchmarkCandles : null,
    initialCash: input.initialCash == null ? 100_000 : Number(input.initialCash),
    feeRate: input.feeRate == null ? 0.001 : Number(input.feeRate),
    slippageBps: input.slippageBps == null ? 0 : Number(input.slippageBps),
    allowShort: input.allowShort === true,
    interval: input.interval ?? "1D",
  };
}

function strategyFor(name) {
  if (name === "buy-and-hold") return ({ index, position }) => index === 0 && position === 0 ? { side: "buy", quantity: 1, type: "market" } : null;
  if (name === "candle-direction") return ({ candle, position }) => {
    if (candle.close > candle.open && position === 0) return { side: "buy", quantity: 1, type: "market" };
    if (candle.close < candle.open && position > 0) return { side: "sell", quantity: position, type: "market" };
    return null;
  };
  throw new Error("unsupported strategy");
}

export function executeBacktest(input) {
  const request = validateRequest(input);
  const result = runBacktest(request.candles, strategyFor(request.strategy), {
    initialCash: request.initialCash,
    feeRate: request.feeRate,
    slippageBps: request.slippageBps,
    allowShort: request.allowShort,
  });
  return {
    result,
    benchmark: request.benchmarkCandles ? compareToBenchmark(result, request.benchmarkCandles) : null,
    meta: { simulated: true, execution: "deterministic-candle", strategy: request.strategy, interval: request.interval },
  };
}

export { validateRequest as validateBacktestRequest };
