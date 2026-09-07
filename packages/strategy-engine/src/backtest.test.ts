import { describe, expect, it } from 'vitest';
import { annualizationPeriodsPerYear, compareToBenchmark, runBacktest, validateBacktestCandles } from './index';

const candles = [
  { time: 1, open: 100, high: 105, low: 99, close: 102 },
  { time: 2, open: 102, high: 110, low: 101, close: 108 },
  { time: 3, open: 108, high: 112, low: 107, close: 110 },
];

describe('runBacktest', () => {
  it('executes deterministic buy and sell orders and calculates return', () => {
    const result = runBacktest(candles, ({ index, position }) => { if (index === 0 && position === 0) return { side: 'buy', quantity: 1 }; if (index === 2 && position === 1) return { side: 'sell', quantity: 1 }; return null; }, { initialCash: 1_000 });
    expect(result.trades).toHaveLength(2); expect(result.finalCash).toBe(1_008); expect(result.finalEquity).toBe(1_008); expect(result.metrics.totalReturn).toBeCloseTo(0.008); expect(result.metrics.maxDrawdown).toBe(0); expect(result.trades[1].realizedPnl).toBe(8); expect(result.metrics.winRate).toBeGreaterThan(0);
  });
  it('applies fees and slippage deterministically', () => {
    const result = runBacktest(candles.slice(0, 1), () => ({ side: 'buy', quantity: 1 }), { initialCash: 1_000, feeRate: 0.001, slippageBps: 100 });
    expect(result.trades[0].price).toBeCloseTo(101); expect(result.trades[0].fee).toBeCloseTo(0.101); expect(result.finalCash).toBeCloseTo(898.899);
  });
  it('does not execute a limit order when the candle does not touch it', () => {
    const result = runBacktest(candles.slice(0, 1), () => ({ side: 'buy', quantity: 1, type: 'limit', limitPrice: 98 }), { initialCash: 1_000 });
    expect(result.trades).toHaveLength(0); expect(result.finalEquity).toBe(1_000);
  });
  it('supports an explicitly enabled short position and realizes short profit', () => {
    const result = runBacktest([{ time: 1, open: 100, high: 101, low: 99, close: 100 }, { time: 2, open: 90, high: 91, low: 89, close: 90 }], ({ index, position }) => { if (index === 0 && position === 0) return { side: 'sell', quantity: 2 }; if (index === 1 && position === -2) return { side: 'buy', quantity: 2 }; return null; }, { initialCash: 1_000, allowShort: true });
    expect(result.finalCash).toBe(1_020); expect(result.finalEquity).toBe(1_020); expect(result.trades[1].realizedPnl).toBe(20);
  });
  it('does not permit short sales unless explicitly enabled', () => {
    const result = runBacktest(candles.slice(0, 1), () => ({ side: 'sell', quantity: 1 }), { initialCash: 1_000 });
    expect(result.trades).toHaveLength(0); expect(result.finalEquity).toBe(1_000);
  });
  it('compares the strategy return against a buy-and-hold benchmark', () => {
    const result = runBacktest(candles, ({ index, position }) => index === 0 && position === 0 ? { side: 'buy', quantity: 1 } : null, { initialCash: 1_000 });
    const comparison = compareToBenchmark(result, candles);
    expect(comparison.strategyReturn).toBeCloseTo(0.008); expect(comparison.benchmarkReturn).toBeCloseTo(0.07843137); expect(comparison.excessReturn).toBeCloseTo(-0.07043137); expect(comparison.benchmarkFinalValue).toBeCloseTo(1_078.43137);
  });
  it('uses explicit interval annualization assumptions', () => {
    expect(annualizationPeriodsPerYear('1m')).toBe(98_280); expect(annualizationPeriodsPerYear('5m')).toBe(19_656); expect(annualizationPeriodsPerYear('15m')).toBe(6_552); expect(annualizationPeriodsPerYear('1H')).toBe(1_638); expect(annualizationPeriodsPerYear('4H')).toBe(409.5); expect(annualizationPeriodsPerYear('1D')).toBe(252); expect(annualizationPeriodsPerYear('1W')).toBe(52); expect(annualizationPeriodsPerYear('1M')).toBe(12);
    const strategy = ({ index, position }) => index === 0 && position === 0 ? { side: 'buy', quantity: 1 } : null;
    const daily = runBacktest(candles, strategy, { initialCash: 1_000, interval: '1D' });
    const weekly = runBacktest(candles, strategy, { initialCash: 1_000, interval: '1W' });
    expect(daily.metrics.sharpeRatio).toBeGreaterThan(weekly.metrics.sharpeRatio);
    expect(daily.metrics.sharpeRatio / weekly.metrics.sharpeRatio).toBeCloseTo(Math.sqrt(252 / 52));
  });
  it('defensively rejects malformed candles for direct engine callers', () => {
    expect(() => validateBacktestCandles([{ ...candles[0], time: 2 }, candles[1]])).toThrow('timestamps must be strictly increasing');
    expect(() => validateBacktestCandles([{ ...candles[0], high: 98 }])).toThrow('high must be at least');
    expect(() => validateBacktestCandles([{ ...candles[0], close: Number.NaN }])).toThrow('close must be a finite positive number');
    expect(() => runBacktest([{ ...candles[0], volume: -1 }], () => null, { initialCash: 1_000 })).toThrow('volume must be a finite non-negative number');
  });
});
