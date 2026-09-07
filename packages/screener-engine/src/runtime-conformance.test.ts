import { describe, expect, it } from 'vitest';
import { screenFundamentals as screenTyped } from './index';
import { screenFundamentals as screenRuntime } from './runtime.js';

describe('Node screener runtime conformance', () => {
  const snapshots = [
    { symbolId: 'NASDAQ:AAPL', asOf: 1, peRatio: 31, revenueGrowth: 0.06, profitMargin: 0.26 },
    { symbolId: 'NASDAQ:MSFT', asOf: 1, peRatio: 36, revenueGrowth: 0.15, profitMargin: 0.35 },
    { symbolId: 'NASDAQ:NVDA', asOf: 1, peRatio: 52, revenueGrowth: 1.2, profitMargin: 0.55 },
  ];

  it('matches the typed implementation for representative filters and groups', () => {
    const queries = [
      { filters: [{ field: 'revenueGrowth', operator: 'gte', value: 0.1 }], limit: 2 },
      { filters: [{ field: 'peRatio', operator: 'lt', value: 50 }], groups: [{ logic: 'or', filters: [{ field: 'profitMargin', operator: 'gte', value: 0.5 }, { field: 'revenueGrowth', operator: 'gte', value: 1 }] }] },
      { filters: [{ field: 'peRatio', operator: 'between', value: 30, upperValue: 40 }] },
    ] as const;

    for (const query of queries) {
      expect(screenRuntime(snapshots, query)).toEqual(screenTyped(snapshots, query));
    }
  });
});
