import { describe, expect, it } from 'vitest';
import { matchesFilter, screenFundamentals } from './index';

const snapshots = [
  { symbolId: 'NYSE:AAA', asOf: 1, marketCap: 10_000, peRatio: 12, revenueGrowth: 0.2, profitMargin: 0.15 },
  { symbolId: 'NYSE:BBB', asOf: 1, marketCap: 20_000, peRatio: 25, revenueGrowth: 0.08, profitMargin: 0.1 },
  { symbolId: 'NYSE:CCC', asOf: 1, marketCap: 5_000, peRatio: 8, revenueGrowth: 0.3, profitMargin: 0.2 },
];

describe('screener-engine', () => {
  it('matches numeric operators and inclusive ranges', () => {
    expect(matchesFilter(snapshots[0], { field: 'peRatio', operator: 'lt', value: 15 })).toBe(true);
    expect(matchesFilter(snapshots[0], { field: 'peRatio', operator: 'between', value: 12, upperValue: 12 })).toBe(true);
  });

  it('treats missing fundamentals as non-matches', () => {
    expect(matchesFilter({ symbolId: 'NYSE:X', asOf: 1 }, { field: 'peRatio', operator: 'gt', value: 1 })).toBe(false);
  });

  it('applies filters, groups, deterministic scoring, and limit', () => {
    const result = screenFundamentals(snapshots, {
      filters: [{ field: 'revenueGrowth', operator: 'gte', value: 0.1 }],
      groups: [{ logic: 'or', filters: [
        { field: 'peRatio', operator: 'lt', value: 10 },
        { field: 'profitMargin', operator: 'gte', value: 0.2 },
      ] }],
      limit: 2,
    });
    expect(result.map(item => item.snapshot.symbolId)).toEqual(['NYSE:CCC']);
    expect(result[0].score).toBe(1);
  });

  it('rejects invalid ranges and limits', () => {
    expect(() => matchesFilter(snapshots[0], { field: 'peRatio', operator: 'between', value: 20, upperValue: 10 })).toThrow();
    expect(() => screenFundamentals(snapshots, { limit: 0 })).toThrow();
  });
});
