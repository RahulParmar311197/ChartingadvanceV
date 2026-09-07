import { describe, expect, it } from 'vitest';
import { runBacktest } from './index';

describe('backtest metrics', () => {
  it('reports realized trade statistics', () => {
    const candles = [
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 110, high: 111, low: 109, close: 110 },
      { time: 3, open: 110, high: 111, low: 109, close: 110 },
    ];
    const result = runBacktest(candles, ({ index, position }) => index === 0 && position === 0 ? { side: 'buy', quantity: 1 } : index === 1 && position === 1 ? { side: 'sell', quantity: 1 } : null, { initialCash: 1000 });
    expect(result.trades[1].realizedPnl).toBe(10);
    expect(result.metrics.tradeCount).toBe(2);
    expect(result.metrics.winRate).toBe(0.5);
    expect(result.metrics.netProfit).toBe(10);
  });

  it('supports controlled short positions', () => {
    const candles = [
      { time: 1, open: 100, high: 101, low: 99, close: 100 },
      { time: 2, open: 90, high: 91, low: 89, close: 90 },
    ];
    const result = runBacktest(candles, ({ index, position }) => index === 0 && position === 0 ? { side: 'sell', quantity: 1 } : index === 1 && position === -1 ? { side: 'buy', quantity: 1 } : null, { initialCash: 1000, allowShort: true });
    expect(result.trades).toHaveLength(2);
    expect(result.trades[1].realizedPnl).toBe(10);
    expect(result.finalEquity).toBe(1010);
  });
});
