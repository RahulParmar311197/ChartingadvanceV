import { describe, expect, it } from "vitest";
import type { Candle } from "../../market-domain/src/index";
import { ema, rsi, sma } from "./index";

const candles: Candle[] = [1, 2, 3, 4, 5, 6].map((close, i) => ({
  time: 1_700_000_000 + i * 60,
  open: close,
  high: close,
  low: close,
  close,
}));

describe("indicator engine", () => {
  it("calculates SMA with null warmup values", () => {
    expect(sma(candles, 3).values).toEqual([null, null, 2, 3, 4, 5]);
  });

  it("calculates EMA from the first complete window", () => {
    expect(ema(candles, 3).values).toEqual([null, null, 2, 3, 4, 5]);
  });

  it("returns 100 RSI for a strictly rising series", () => {
    expect(rsi(candles, 3).values.slice(0, 3)).toEqual([null, null, null]);
    expect(rsi(candles, 3).values.slice(3)).toEqual([100, 100, 100]);
  });

  it("rejects invalid periods", () => {
    expect(() => sma(candles, 0)).toThrow(/positive integer/);
    expect(() => ema(candles, 1.5)).toThrow(/positive integer/);
    expect(() => rsi(candles, -2)).toThrow(/positive integer/);
  });
});
