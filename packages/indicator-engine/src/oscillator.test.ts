import { describe, expect, it } from "vitest";
import type { Candle } from "../../market-domain/src/index";
import { createRsiSeries } from "./oscillator";

const candles: Candle[] = [1, 2, 3, 2, 4, 3].map((close, index) => ({
  time: 100 + index,
  open: close,
  high: close,
  low: close,
  close,
  volume: 1,
}));

describe("RSI oscillator adapter", () => {
  it("drops warmup points and preserves candle timestamps", () => {
    expect(createRsiSeries(candles, 3)).toEqual({
      id: "rsi:3",
      label: "RSI 3",
      points: [
        { time: 103, value: 66.66666666666666 },
        { time: 104, value: 80 },
        { time: 105, value: 57.14285714285714 },
      ],
    });
  });

  it("keeps RSI values within the oscillator domain", () => {
    const series = createRsiSeries(candles, 3);
    expect(series.points.every(({ value }) => value >= 0 && value <= 100)).toBe(true);
  });
});
