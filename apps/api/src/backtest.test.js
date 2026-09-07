import { describe, expect, it } from "vitest";
import { executeBacktest, validateBacktestRequest } from "./backtest.js";

const candles = [
  { time: 1, open: 100, high: 105, low: 95, close: 102, volume: 10 },
  { time: 2, open: 102, high: 110, low: 100, close: 108, volume: 10 },
];

describe("backtest application service", () => {
  it("runs the safe built-in buy-and-hold strategy", () => {
    const result = executeBacktest({ strategy: "buy-and-hold", candles, initialCash: 1_000 });
    expect(result.meta).toMatchObject({ simulated: true, execution: "deterministic-candle", strategy: "buy-and-hold" });
    expect(result.result.trades).toHaveLength(1);
    expect(result.result.finalEquity).toBe(1_008);
  });

  it("optionally compares the strategy with supplied benchmark candles", () => {
    const result = executeBacktest({ strategy: "buy-and-hold", candles, benchmarkCandles: candles, initialCash: 1_000 });
    expect(result.benchmark).toMatchObject({ benchmarkReturn: 0.05882352941176472, strategyReturn: 0.008 });
  });

  it("rejects arbitrary or oversized strategy requests", () => {
    expect(() => validateBacktestRequest({ strategy: "javascript", candles })).toThrow("unsupported strategy");
    expect(() => validateBacktestRequest({ strategy: "buy-and-hold", candles: [] })).toThrow("1 to 20000 bars");
  });
});
