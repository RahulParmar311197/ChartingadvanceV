import { describe, expect, it } from "vitest";
import type { Candle } from "../../market-domain/src/index";
import { createMovingAverageOverlay } from "./overlay";

const candles: Candle[] = [1, 2, 3, 4, 5].map((close, index) => ({
  time: 100 + index,
  open: close,
  high: close,
  low: close,
  close,
  volume: 1,
}));

describe("moving-average overlays", () => {
  it("drops warmup points and preserves candle timestamps", () => {
    expect(createMovingAverageOverlay(candles, "sma", 3)).toEqual({
      id: "sma:3",
      label: "SMA 3",
      points: [
        { time: 102, value: 2 },
        { time: 103, value: 3 },
        { time: 104, value: 4 },
      ],
    });
  });

  it("uses the EMA engine without changing the shared candle contract", () => {
    const overlay = createMovingAverageOverlay(candles, "ema", 3);
    expect(overlay.id).toBe("ema:3");
    expect(overlay.points[0]).toEqual({ time: 102, value: 2 });
  });
});
