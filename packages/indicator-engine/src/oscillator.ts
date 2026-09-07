import type { Candle } from "../../market-domain/src/index";
import { rsi } from "./index";

export interface OscillatorPoint {
  time: number;
  value: number;
}

export interface OscillatorSeries {
  id: string;
  label: string;
  points: OscillatorPoint[];
}

export function createRsiSeries(candles: readonly Candle[], period: number): OscillatorSeries {
  const result = rsi(candles, period);
  return {
    id: result.id,
    label: `RSI ${period}`,
    points: candles.flatMap((candle, index) => {
      const value = result.values[index];
      return value === null ? [] : [{ time: candle.time, value }];
    }),
  };
}
