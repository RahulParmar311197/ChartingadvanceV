import type { Candle } from "../../market-domain/src/index";
import { ema, sma } from "./index";

export interface OverlayPoint {
  time: number;
  value: number;
}

export interface OverlaySeries {
  id: string;
  label: string;
  points: OverlayPoint[];
}

export function createMovingAverageOverlay(
  candles: readonly Candle[],
  kind: "sma" | "ema",
  period: number,
): OverlaySeries {
  const result = kind === "sma" ? sma(candles, period) : ema(candles, period);
  return {
    id: result.id,
    label: `${kind.toUpperCase()} ${period}`,
    points: candles.flatMap((candle, index) => {
      const value = result.values[index];
      return value === null ? [] : [{ time: candle.time, value }];
    }),
  };
}
