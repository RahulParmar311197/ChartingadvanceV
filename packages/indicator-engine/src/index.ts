import type { Candle } from "../../market-domain/src/index";

export type IndicatorPoint = number | null;
export interface IndicatorResult { id: string; values: IndicatorPoint[]; }

export function sma(candles: readonly Candle[], period: number): IndicatorResult {
  assertPeriod(period);
  const values: IndicatorPoint[] = candles.map(() => null);
  let sum = 0;
  for (let i = 0; i < candles.length; i += 1) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) values[i] = sum / period;
  }
  return { id: `sma:${period}`, values };
}

export function ema(candles: readonly Candle[], period: number): IndicatorResult {
  assertPeriod(period);
  const values: IndicatorPoint[] = candles.map(() => null);
  if (candles.length < period) return { id: `ema:${period}`, values };
  const multiplier = 2 / (period + 1);
  let previous = candles.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;
  values[period - 1] = previous;
  for (let i = period; i < candles.length; i += 1) {
    previous = (candles[i].close - previous) * multiplier + previous;
    values[i] = previous;
  }
  return { id: `ema:${period}`, values };
}

export function rsi(candles: readonly Candle[], period: number): IndicatorResult {
  assertPeriod(period);
  const values: IndicatorPoint[] = candles.map(() => null);
  if (candles.length <= period) return { id: `rsi:${period}`, values };
  let gains = 0; let losses = 0;
  for (let i = 1; i <= period; i += 1) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) gains += change; else losses -= change;
  }
  let averageGain = gains / period; let averageLoss = losses / period;
  values[period] = toRsi(averageGain, averageLoss);
  for (let i = period + 1; i < candles.length; i += 1) {
    const change = candles[i].close - candles[i - 1].close;
    averageGain = ((averageGain * (period - 1)) + Math.max(change, 0)) / period;
    averageLoss = ((averageLoss * (period - 1)) + Math.max(-change, 0)) / period;
    values[i] = toRsi(averageGain, averageLoss);
  }
  return { id: `rsi:${period}`, values };
}

function toRsi(gain: number, loss: number): number {
  if (loss === 0) return 100;
  if (gain === 0) return 0;
  return 100 - (100 / (1 + gain / loss));
}
function assertPeriod(period: number): void {
  if (!Number.isInteger(period) || period <= 0) throw new Error("Indicator period must be a positive integer");
}
